'use strict';

const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'avatar',
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
    const guild = message.channel.guild;
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

    message.reply(member.user.avatarURL());
  }
};
