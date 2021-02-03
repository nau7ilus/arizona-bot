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
      name: 'warns',
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

    if (!settings.allowedCommands.includes(this.name)) {
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

    const warns = await Punishment.find({
      guildID: guild.id,
      userID: member.id,
      type: 1,
    }).exec();
    message.channel.send(
      new MessageEmbed()
        .setAuthor(`Предупреждения пользователя ${member.user.username}`, member.user.avatarURL())
        .setDescription(
          warns.map(e => `[${getPunishmentID(e)}] ${e.reason} | ${e.createdAt.toLocaleString()}`).join('\n'),
        ),
    );
  }
};
