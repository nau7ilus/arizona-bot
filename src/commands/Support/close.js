'use strict';

const { action } = require('../../handlers/support');
const Command = require('../../structures/Command');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'close',
    });
  }
  // eslint-disable-next-line require-await
  async run({ message }) {
    action(message, message.member, 'close');
  }
};