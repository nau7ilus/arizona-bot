'use strict';

const { MessageEmbed } = require('discord.js');
const Punishment = require('../../models/Punishment');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'vunmute',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
      arguments: {
        member: {
          type: 'user',
          required: true,
        },
      },
    });
  }
  async run({ args, message }) {
    const guild = message.guild;

    const settings = moderationConfig[guild.id];
    if (!settings) return;

    if (!settings.allowedRoles.includes(this.name)) {
      sendErrorMessage({
        message,
        content: 'Недоступно на этом сервере!',
        member: message.member,
      });
      return;
    }

    const [memberString] = args;

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
    if (!overwrite || !overwrite.deny.has('SPEAK')) {
      sendErrorMessage({
        message,
        content: 'Этот пользователь незамучен!',
        member: message.member,
      });
      return;
    } else if (overwrite.deny.bitfield === 0x200000 && overwrite.allow.bitfield === 0) {
      overwrite.delete();
    } else {
      overwrite.update({
        SPEAK: null,
      });
    }

    await member.voice.setChannel(channel);

    await Punishment.deleteOne({
      guildID: guild.id,
      userID: member.id,
      channelID: channel.id,
      type: 4,
    }).exec();

    message.channel.send(
      new MessageEmbed().setAuthor(
        `${member.user.username} был размучен в канале ${channel.name}`,
        member.user.avatarURL(),
      ),
    );
  }
};
