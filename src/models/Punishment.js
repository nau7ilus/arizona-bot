'use strict';

const { Schema, model } = require('mongoose');

const PunishmentSchema = new Schema(
  {
    guildID: { type: String, required: true },
    userID: { type: String, required: true },
    moderID: { type: String, required: true },
    channelID: { type: String },
    // 0 - Mute, 1 - Warn, 2 - Ban, 3 - NoExp, 4 - VoiceMute
    type: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    validUntil: { type: Date },
    reason: { type: String },
  },
  { versionKey: false },
);

module.exports = model('punishments', PunishmentSchema);
