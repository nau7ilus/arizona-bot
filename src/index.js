'use strict';

require('dotenv').config();

const Client = require('./structures/Client');

const client = new Client({
  devs: ['422109629112254464'],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  messageCacheLifetime: 60,
  messageSweepInterval: 120,
  fetchAllMembers: true,
});

client.login();
client.loadEvents();

module.exports = client;
