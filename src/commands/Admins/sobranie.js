'use strict';

const Command = require('../../structures/Command');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'sobranie',
    });
  }
  // eslint-disable-next-line require-await
  async run({ message }) {
    // Only for Red-Rock
    if (message.guild.id !== '470981734863994881') return;
    this.client.commands.get('meeting').run({ message });
  }
};
