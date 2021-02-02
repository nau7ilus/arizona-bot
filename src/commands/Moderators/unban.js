'use strict';

const { MessageEmbed } = require('discord.js');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'unban',
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
  // eslint-disable-next-line require-await
  async run({ args, message }) {
    const guild = message.guild;

    const settings = moderationConfig[guild.id];
    if (!settings) return;

    const [memberString] = args;

    const memberID = memberString.match(/\d{18}/)[0];

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

    guild
      .fetchBan(memberID)
      .then(() => {
        guild.members.unban(memberID);
        message.channel.send(new MessageEmbed().setAuthor(`${memberID} был разбанен`));
      })
      .catch(() => {
        sendErrorMessage({
          message,
          content: 'Данный пользователь незабанен!',
          member: message.member,
        });
      });
  }
};
