'use strict';

const { Schema, model } = require('mongoose');

const LogSchema = new Schema(
  {
    userID: { type: String, required: true },
    origin: { type: String, required: true },
    discordData: {
      guildID: { type: String },
      channelID: { type: String },
      messageID: { type: String },
    },
    actionID: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    details: { type: Array },
  },
  { versionKey: false },
);

module.exports = model('log', LogSchema);
