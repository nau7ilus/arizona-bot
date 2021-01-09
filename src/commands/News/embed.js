'use strict';

const Command = require('../../structures/Command');
const newsCongig = require('../../utils/config').newsConfig;
const { sendErrorMessage } = require('../../utils/index');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'embed',
    });
  }
  // eslint-disable-next-line require-await
  async run({ args, message }) {
    message.delete();

    const settings = newsCongig[message.guild.id];
    if (!settings) return;

    if (
      !message.member.hasPermission('ADMINISTRATOR') &&
      !message.member.roles.cache.some(r => settings.allowedRoles.includes(r.id))
    ) {
      sendErrorMessage({
        message: message,
        content: 'У вас нет прав',
        member: message.member,
        react: false,
      });
      return;
    }

    if (args.length === 0 || args[0] === '') args[0] = 'help';

    require('../../handlers/news').action(message, message.member, args[0], args.slice(1));
  }
};
