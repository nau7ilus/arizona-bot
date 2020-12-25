'use strict';

const { Schema, model } = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const SuggestionSchema = new Schema(
  {
    guildID: { type: String, required: true },
    authorID: { type: String, required: true },
    channelID: { type: String, required: true },
    messageID: { type: String, unique: true },
  },
  { versionKey: false },
);

SuggestionSchema.plugin(autoIncrement.plugin, 'suggestions');

module.exports = model('suggestions', SuggestionSchema);
