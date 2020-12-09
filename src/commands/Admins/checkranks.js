'use strict';

const { get } = require('axios');
const { giveLevelRole } = require('../../handlers/levels-handler');
const Command = require('../../structures/Command');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'checkranks',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
    });
  }
  async run({ args, message }) {
    const page = args[0] || 0;
    const leadersBoard = await get(
      `https://mee6.xyz/api/plugins/levels/leaderboard/${process.env.GUILD_ID}?page=${page}`,
    );

    const players = leadersBoard.data.players;

    players.forEach(player => {
      const member = message.guild.members.cache.get(player.id);
      if (!member) return console.log('Нет юзера', player.id);
      return giveLevelRole(member, player.level, false);
    });
  }
};
