'use strict';

const { Schema, model } = require('mongoose');

const PunishmentSchema = new Schema(
  {
    guildID: { type: String, required: true },
    userID: { type: String, required: true },
    moderID: { type: String, required: true },
    // 0 - Mute
    type: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    validUntil: { type: Date },
    reason: { type: String },
  },
  { versionKey: false },
);

module.exports = model('punishments', PunishmentSchema);
