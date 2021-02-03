'use strict';

const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'clear',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
      arguments: {
        'length or member': {
          type: 'number',
          required: true,
          description: 'Число сообщений или пользователь (ID или упоминание)',
        },
      },
      aliases: ['purge'],
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

    await message.delete();

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

    const messages = await message.channel.messages.fetch();

    const toDelete = args[0].match(/\d{18}/)
      ? messages
          .array()
          .filter(
            msg =>
              msg.author.id === args[0].match(/\d{18}/)[0] && Date.now() - msg.createdAt <= 14 * 24 * 60 * 60 * 1000,
          )
      : +args[0];
    message.channel
      .bulkDelete(toDelete)
      .then(deleted => {
        message.reply(`удалено ${deleted.size} сообщений`).then(msg => {
          msg.delete({
            timeout: 3000,
          });
        });
      })
      .catch(() => {
        message.reply(`невозможно удалить сообщения старше 14 дней`).then(msg => {
          msg.delete({
            timeout: 3000,
          });
        });
      });
  }
};
