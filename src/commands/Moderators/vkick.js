'use strict';

const { MessageEmbed } = require('discord.js');
const Log = require('../../models/Log');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'vkick',
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

    if (!settings.allowedCommands.includes(this.name)) {
      sendErrorMessage({
        message,
        content: 'Недоступно на этом сервере!',
        member: message.member,
      });
      return;
    }

    const [memberString, reason] = args;

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
        content: 'Вы не можете кикнуть этого пользователя!',
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

    await member.voice.kick(reason);

    const logMessage = new Log({
      origin: message.member.id,
      target: member.id,
      discordData: {
        guildsID: [guild.id],
        channelsID: [message.channel.id, channel.id],
        messagesID: [message.id],
        usersID: [message.member.id, member.id],
      },
      actionID: 11,
      details: {
        reason,
        channelID: channel.id,
      },
    });
    await logMessage.save();

    message.channel.send(
      new MessageEmbed().setAuthor(
        `${member.user.username} был кикнут с канала ${channel.name}`,
        member.user.avatarURL(),
      ),
    );
  }
};
