'use strict';

const { action } = require('../../handlers/support');
const Command = require('../../structures/Command');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'active',
    });
  }
  // eslint-disable-next-line require-await
  async run({ message }) {
    if (message.guild.id !== process.env.GUILD_ID) return;
    action(message, message.member, 'active');
  }
};
