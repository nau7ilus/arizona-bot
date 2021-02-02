'use strict';

const { MessageEmbed } = require('discord.js');
const Punishment = require('../../models/Punishment');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'warn',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
      arguments: {
        member: {
          type: 'user',
          required: true,
        },
        reason: {
          type: 'spaceString',
        },
      },
    });
  }
  async run({ args, message }) {
    const guild = message.guild;

    const settings = moderationConfig[guild.id];
    if (!settings) return;

    const [memberString, reason] = args;

    const duration = settings.warnDuration;

    const member = guild.member(memberString.match(/\d{18}/)[0]);
    if (!member) {
      sendErrorMessage({
        message,
        content: 'Указанного пользователя нет на сервере',
        member: message.member,
      });
      return;
    }

    if (
      !message.member.hasPermission('ADMINISTRATOR') &&
      !message.member.roles.cache.some(r => settings.moderatorRoles.includes(r.id))
    ) {
      sendErrorMessage({
        message,
        content: 'У вас нет прав!',
        member: message.member,
      });
      return;
    }

    if (
      member.user.bot ||
      member.hasPermission('ADMINISTRATOR') ||
      member.roles.cache.some(r => settings.inviolableRoles.includes(r.id))
    ) {
      sendErrorMessage({
        message,
        content: 'Вы не можете предупредить этого пользователя!',
        member: message.member,
      });
      return;
    }

    const warn = new Punishment({
      guildID: guild.id,
      userID: member.id,
      moderID: message.member.id,
      type: 1,
      validUntil: Date.now() + duration,
      reason: reason || 'Не указано',
    });
    await warn.save();

    message.channel.send(new MessageEmbed().setTitle('[WARN]'));
  }
};
