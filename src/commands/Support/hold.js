'use strict';

const { action } = require('../../handlers/support');
const Command = require('../../structures/Command');
const supportConfig = require('../../utils/config').supportSettings;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'hold',
    });
  }
  // eslint-disable-next-line require-await
  async run({ message }) {
    const settings = supportConfig[message.guild.id];
    if (!settings) return;

    action(message, message.member, 'hold', settings);
  }
};
