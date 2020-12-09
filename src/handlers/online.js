'use strict';

const { getFractionPlayers } = require('@nieopierzony/core');

exports.getOnline = async (client, query, force = false, cache = true) => {
  const { serverID, fractionID } = query;
  console.log(query);
  if (
    !force &&
    client.players[serverID] &&
    client.playersUpdate[serverID] &&
    client.players[serverID][fractionID] &&
    client.playersUpdate[serverID][fractionID] &&
    Date.now() - client.playersUpdate[serverID][fractionID] < 5 * 60 * 1000
  ) {
    return client.players[serverID][fractionID];
  }

  const players = await getFractionPlayers(serverID, fractionID);

  if (cache) {
    if (!client.players[serverID]) {
      client.players[serverID] = {};
    }
    if (!client.playersUpdate[serverID]) {
      client.playersUpdate[serverID] = {};
    }

    client.players[serverID][fractionID] = players;
    client.playersUpdate[serverID][fractionID] = Date.now();
  }

  return players;
};
