'use strict';

const { MessageEmbed } = require('discord.js');
const Log = require('../../models/Log');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'lock',
      arguments: {
        channel: {
          type: 'channel',
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

    const [channelString] = args;

    const channel = channelString ? guild.channels.resolve(channelString.match(/\d{18}/)[0]) : message.channel;
    if (!channel) {
      sendErrorMessage({
        message,
        content: 'Указанный канал не найден на сервере',
        member: message.member,
      });
      return;
    }

    if (
      (!message.member.hasPermission('ADMINISTRATOR') &&
        !message.member.roles.cache.some(r => settings.headModeratorRoles.includes(r.id))) ||
      !channel.permissionsFor(message.member).has('MANAGE_MESSAGES', true)
    ) {
      sendErrorMessage({
        message,
        content: 'У вас нет прав!',
        member: message.member,
      });
      return;
    }

    await channel.overwritePermissions([
      {
        id: message.guild.id,
        deny: ['SEND_MESSAGES'],
      },
    ]);

    const logMessage = new Log({
      origin: message.member.id,
      target: channel.id,
      discordData: {
        guildsID: [guild.id],
        channelsID: [message.channel.id, channel.id],
        messagesID: [message.id],
        usersID: [message.member.id],
      },
      actionID: 13,
    });
    await logMessage.save();

    message.channel.send(
      new MessageEmbed().setAuthor(
        `${channel.name} был заблокирован модератором ${message.member.displayName}`,
        message.member.user.avatarURL(),
      ),
    );
  }
};