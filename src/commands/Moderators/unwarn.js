'use strict';

const { MessageEmbed } = require('discord.js');
const { getPunishmentID } = require('../../handlers/moderators');
const Punishment = require('../../models/Punishment');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'unwarn',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
      arguments: {
        member: {
          type: 'user',
          required: true,
        },
        id: {
          type: 'number',
          required: true,
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

    const [memberString, id] = args;

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

    const warns = await Punishment.find({
      guildID: guild.id,
      userID: member.id,
      type: 1,
    }).exec();

    const warn = warns.find(e => getPunishmentID(e) === +id);

    if (!warn) {
      sendErrorMessage({
        message,
        content: 'Указанное предупреждение не найдено!',
        member: message.member,
      });
      return;
    }

    await Punishment.findByIdAndDelete(warn._id).exec();

    message.channel.send(new MessageEmbed().setTitle('[UNWARN]'));
  }
};
