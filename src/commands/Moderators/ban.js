'use strict';

const { ban } = require('../../handlers/moderators');
const Command = require('../../structures/Command');
const { resolveDuration, sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'ban',
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
  // eslint-disable-next-line require-await
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

    const memberID = memberString.match(/\d{18}/)[0];

    if (
      !message.member.hasPermission('ADMINISTRATOR') &&
      !message.member.roles.cache.some(r => settings.headModeratorRoles.includes(r.id))
    ) {
      sendErrorMessage({
        message,
        content: 'У вас нет прав!',
        member: message.member,
      });
      return;
    }

    const member = guild.member(memberID);

    if (
      member &&
      (member.user.bot ||
        member.hasPermission('ADMINISTRATOR') ||
        member.roles.cache.some(r => settings.inviolableRoles.includes(r.id)))
    ) {
      sendErrorMessage({
        message,
        content: 'Вы не можете забанить этого пользователя!',
        member: message.member,
      });
      return;
    }

    ban(guild, memberID, duration, reason, message);
  }
};
