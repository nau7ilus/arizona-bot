'use strict';

const { MessageEmbed } = require('discord.js');
const Punishment = require('../../models/Punishment');
const Command = require('../../structures/Command');
const { resolveDuration, sendErrorMessage } = require('../../utils');
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

    const [memberString, durationString, reason] = args;

    const duration = resolveDuration(durationString);

    const member = guild.member(memberString.match(/\d{18}/)[0]);
    if (!member) {
      sendErrorMessage({
        message,
        content: 'Указанного пользователя нет на сервере',
        member: message.member,
      });
      return;
    }

    const role = guild.roles.cache.get(settings.mutedRole);
    if (!role) throw new Error('Роль Muted для этого сервера не найдена');

    // TODO: check perms

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

    message.channel.send(new MessageEmbed().setTitle('[MUTE]'));
  }
};
