'use strict';

module.exports = async (client, reaction, reactedUser) => {
  if (reaction.partial) await reaction.fetch();
  if (reactedUser.bot) return;

  require('../handlers/support').handleReactions(client, reaction, reactedUser);
  require('../handlers/family').handleReactions(client, reaction, reactedUser);
  // require('../handlers/protection').handleReactions(client, reaction, reactedUser);
};
