/* eslint-disable consistent-return */
'use strict';

const { MessageEmbed } = require('discord.js');
const { isModer } = require('../../handlers/suggestions');
const Suggestion = require('../../models/Suggestion');
const Command = require('../../structures/Command');
const suggestionsConfig = require('../../utils/config').suggestions;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'get-author',
    });
  }
  // eslint-disable-next-line require-await
  async run({ message, args }) {
    const settings = suggestionsConfig[message.guild.id];
    if (!settings) return;

    if (!isModer(message.member, settings)) {
      return message.channel.send(
        message.member,
        new MessageEmbed().setColor('RED').setTitle('У вас нет прав на использование данной команды'),
      );
    }

    const suggestionID = +args[0];
    if (isNaN(suggestionID)) {
      return message.channel.send(
        message.member,
        new MessageEmbed().setColor('RED').setTitle(`Вы должны указать ID предложения - \`/get-author <id>\``),
      );
    }

    const suggestion = await Suggestion.findById(suggestionID);
    if (!suggestion) {
      return message.channel.send(
        message.member,
        new MessageEmbed().setColor('RED').setTitle(`Предложение с ID ${suggestionID} не найдено`),
      );
    }

    message.channel.send(
      `Автор предложения **#${suggestionID}** - <@!${suggestion.authorID}> \`[${suggestion.authorID}]\``,
    );
  }
};
