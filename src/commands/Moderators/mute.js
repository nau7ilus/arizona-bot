'use strict';

const { MessageEmbed } = require('discord.js');
const Punishment = require('../../models/Punishment');
const Command = require('../../structures/Command');
const { resolveDuration, sendErrorMessage, formatDuration } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'mute',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
      arguments: {
        member: {
          type: 'user',
          required: true,
        },
        duration: {
          type: 'time',
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

    if (!settings.allowedCommands.includes(this.name)) {
      sendErrorMessage({
        message,
        content: 'Недоступно на этом сервере!',
        member: message.member,
      });
      return;
    }

    const [memberString, durationString, reason] = args;

    const duration = resolveDuration(durationString);

    const member = guild.member(memberString.match(/\d{18}/)[0]);
    if (!member) {
      sendErrorMessage({
        message,
        content: 'Указанный пользователь не найден на сервере',
        member: message.member,
      });
      return;
    }

    const role = guild.roles.cache.get(settings.mutedRole);
    if (!role) throw new Error('Роль Muted для этого сервера не найдена');

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
        content: 'Вы не можете замутить этого пользователя!',
        member: message.member,
      });
      return;
    }

    if (member.roles.cache.has(role.id)) {
      sendErrorMessage({
        message,
        content: 'Этот пользователь уже замучен!',
        member: message.member,
      });
      return;
    }

    await member.roles.add(role);
    const mute = new Punishment({
      guildID: guild.id,
      userID: member.id,
      moderID: message.member.id,
      type: 0,
      validUntil: Date.now() + duration,
      reason: reason || 'Не указано',
    });
    await mute.save();

    message.channel.send(
      new MessageEmbed().setAuthor(
        `${member.user.username} был замучен на ${formatDuration(duration)}`,
        member.user.avatarURL(),
      ),
    );
  }
};
