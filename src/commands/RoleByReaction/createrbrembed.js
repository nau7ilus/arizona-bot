'use strict';

const { MessageEmbed } = require('discord.js');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const rolebyreactionConfig = require('../../utils/config').rolebyreactionConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'createrbrembed',
    });
  }
  // eslint-disable-next-line require-await
  async run({ message }) {
    const guild = message.guild;
    // Поиск настроек
    const settings = rolebyreactionConfig[guild.id];
    if (!settings) return;

    if (!message.member.hasPermission('ADMINISTRATOR')) {
      sendErrorMessage({
        message: message,
        content: `У вас нет прав на использование этой команды`,
        member: message.member,
        react: false,
      });
      return;
    }

    if (message.channel.id !== settings.channel) {
      sendErrorMessage({
        message: message,
        content: `Неверный канал для использования`,
        member: message.member,
        react: false,
      });
      return;
    }

    const embed = new MessageEmbed()
      .setTitle(settings.embed.title)
      .setDescription(settings.embed.description)
      .setColor(settings.embed.color)
      .setFooter(settings.embed.footer);

    const msg = await message.channel.send(embed);
    await msg.react(settings.emoji);
  }
};
