/* eslint-disable consistent-return */
'use strict';

const { MessageEmbed } = require('discord.js');
const Suggestion = require('../models/Suggestion');
const suggestionsConfig = require('../utils/config').suggestions;

exports.handleMessage = async message => {
  const settings = suggestionsConfig[message.guild.id];
  // eslint-disable-next-line no-useless-return
  if (!settings || message.channel.id !== settings.channelID) return;

  const suggestionDoc = await Suggestion.create({
    guildID: message.guild.id,
    channelID: message.channel.id,
    authorID: message.author.id,
  });

  const embed = new MessageEmbed()
    .setColor(0x4f67ff)
    .setAuthor(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
    .setTitle(`Предложение #${suggestionDoc._id}`)
    .setDescription(message.content);

  message.delete();
  message.channel.send(embed).then(msg => {
    msg.react('⬆️');
    msg.react('⬇️');

    suggestionDoc.messageID = msg.id;
    suggestionDoc.save();
  });
};

const config = {
  approve: { color: 0xa1ffbf, title: 'Одобрено', description: 'одобрено' },
  consider: { color: 0xfff04f, title: 'На рассмотрении', description: 'установлено "На рассмотрении"' },
  deny: { color: 0xffa1bd, title: 'Отказано', description: 'отказано' },
  implement: { color: 0x4fffe5, title: 'Введено', description: 'введено на сервер' },
};

exports.action = async (message, action) => {
  const settings = suggestionsConfig[message.guild.id];
  if (!settings) return;

  if (
    !message.member.hasPermission('ADMINISTRATOR') &&
    !message.member.roles.cache.some(r => settings.moderators.includes(r.id))
  ) {
    return message.channel.send(
      message.member,
      new MessageEmbed().setColor('RED').setTitle('У вас нет прав на использование данной команды'),
    );
  }

  const args = message.content.slice(1).trim().split(/ +/g);

  const suggestionID = +args[1];
  if (isNaN(suggestionID)) {
    return message.channel.send(
      message.member,
      new MessageEmbed().setColor('RED').setTitle(`Вы должны указать ID предложения - \`/${args[0]} <id> [причина]\``),
    );
  }

  const reason = args.slice(2).join(' ');
  if (reason && reason.length > 1024) {
    return message.channel.send(
      message.member,
      new MessageEmbed().setColor('RED').setTitle('Причина должна быть меньше 1024 символов'),
    );
  }

  const suggestion = await Suggestion.findById(suggestionID);
  if (!suggestion) {
    return message.channel.send(
      message.member,
      new MessageEmbed().setColor('RED').setTitle(`Предложение с ID ${suggestionID} не найдено`),
    );
  }

  const suggestionsChannel = message.guild.channels.cache.get(suggestion.channelID);
  if (!suggestionsChannel) {
    return message.channel.send(
      message.member,
      new MessageEmbed().setColor('RED').setTitle(`Канал, куда было отправлено предложение не найден`),
    );
  }

  const suggestionMsg = await suggestionsChannel.messages.fetch(suggestion.messageID);
  if (!suggestionMsg) {
    return message.channel.send(
      message.member,
      new MessageEmbed().setColor('RED').setTitle(`Не могу найти сообщение с предложением`),
    );
  }

  const embed = suggestionMsg.embeds[0]
    .setColor(config[action].color)
    .setTitle(`Предложение #${suggestionID} | ${config[action].title}`);
  embed.fields[0] = { name: `Причина от ${message.author.tag}`, value: reason || 'Причина не указана', inline: false };

  suggestionMsg.edit(embed);
  message.channel.send(embed).then(msg => {
    msg.delete({ timeout: 5000 });
    message.react('👍');
  });

  const approvedChannel = message.guild.channels.cache.get(settings.approvedChannelID);
  if (approvedChannel && ['approve', 'implement', 'consider'].includes(action)) {
    approvedChannel.send(embed);
  }

  const suggestionAuthor = message.client.users.cache.get(suggestion.authorID);
  if (suggestionAuthor) {
    suggestionAuthor.send(
      `Привет! Твое предложение **#${suggestionID}** на сервере **${message.guild.name}**` +
        `было ${config[action].description} модератором **${message.author.tag}**`,
      embed,
    );
  }
};
