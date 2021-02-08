'use strict';

const { MessageEmbed } = require('discord.js');
const Log = require('../../models/Log');
const Punishment = require('../../models/Punishment');
const Command = require('../../structures/Command');
const { resolveDuration, sendErrorMessage, formatDuration } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'vmute',
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

    const channel = member.voice.channel;

    if (!channel) {
      sendErrorMessage({
        message,
        content: 'Данный пользователь не находится в голосовом канале',
        member: message.member,
      });
      return;
    }

    const overwrite = channel.permissionOverwrites.get(member.id);
    if (!overwrite) {
      await channel.overwritePermissions(
        [
          {
            id: member.id,
            deny: 'SPEAK',
          },
        ],
        reason,
      );
    } else if (overwrite.deny.has('SPEAK')) {
      sendErrorMessage({
        message,
        content: 'Этот пользователь уже замучен!',
        member: message.member,
      });
      return;
    } else {
      overwrite.update({
        SPEAK: false,
      });
    }

    await member.voice.setChannel(channel);

    const mute = new Punishment({
      guildID: guild.id,
      userID: member.id,
      moderID: message.member.id,
      channelID: channel.id,
      type: 4,
      validUntil: Date.now() + duration,
      reason: reason || 'Не указано',
    });
    await mute.save();

    const logMessage = new Log({
      origin: message.member.id,
      target: member.id,
      discordData: {
        guildsID: [guild.id],
        channelsID: [message.channel.id, channel.id],
        messagesID: [message.id],
        usersID: [message.member.id, member.id],
      },
      actionID: 9,
      details: {
        reason,
        duration,
        channelID: channel.id,
      },
    });
    await logMessage.save();

    message.channel.send(
      new MessageEmbed().setAuthor(
        `${member.user.username} был замучен в канале ${channel.name} на ${formatDuration(duration)}`,
        member.user.avatarURL(),
      ),
    );
  }
};
