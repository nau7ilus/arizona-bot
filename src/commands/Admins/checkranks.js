'use strict';

const { get } = require('axios');
const { giveLevelRole } = require('../../handlers/levels-handler');
const Command = require('../../structures/Command');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'checkranks',
      devOnly: true,
      userPermissions: ['ADMINISTATOR'],
    });
  }
  async run({ args, message }) {
    const page = args[0] || 0;
    const leadersBoard = await get(
      `https://mee6.xyz/api/plugins/levels/leaderboard/${process.env.GUILD_ID}?page=${page}`,
    );

    const players = leadersBoard.data.players;

    // eslint-disable-next-line consistent-return
    players.forEach(async player => {
      const member = await message.guild.members.fetch(player.id);
      if (!member) return console.log('Нет юзера', player.id);
      await giveLevelRole(member, player.level, false);
    });
  }
};
