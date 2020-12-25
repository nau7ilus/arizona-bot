'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const Client = require('./structures/Client');

const client = new Client({
  devs: ['422109629112254464', '266132370426429440', '373206800196960268'],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  messageCacheLifetime: 60,
  messageSweepInterval: 120,
  fetchAllMembers: true,
});

mongoose.connect(
  process.env.DATABASE_URL,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  },
  err => {
    if (err) throw err;
    console.log('[Database] База данных Mongo успешно подключена.');
  },
);
autoIncrement.initialize(mongoose.connection);

client.login();
client.loadEvents();

module.exports = client;
