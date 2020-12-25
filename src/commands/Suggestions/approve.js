'use strict';

const { action } = require('../../handlers/suggestions');
const Command = require('../../structures/Command');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'approve',
    });
  }
  // eslint-disable-next-line require-await
  async run({ message }) {
    action(message, 'approve');
  }
};
