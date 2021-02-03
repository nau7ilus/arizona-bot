'use strict';

const { Schema, model } = require('mongoose');

/**
 * Moderators:
 * 0. Mute
 * 1. Unmute
 *
 * 2. Ban
 * 3. Unban
 * 4. Allow Gain Exp
 *
 * 5. Warn
 * 6. Unwarn
 *
 * 7. Kick
 * 8. Set Name
 *
 * 9. Voice Mute
 * 10. Voice Unmute
 * 11. Voice Kick
 *
 * 12. Voteban
 *
 * 13. Lock
 * 14. Unlock
 *
 * Rules:
 * 15. Create
 * 16. Edit
 * 17. Add point
 *
 * Suggestions:
 * 18. Approve
 * 19. Consider
 * 20. Deny
 * 21. Implement
 *
 * Support:
 * 22. Active
 * 23. Close
 * 24. Hold
 */

const LogSchema = new Schema(
  {
    usersID: { type: [String], required: true },
    origin: { type: String, required: true },
    discordData: {
      guildID: { type: String },
      channelID: { type: String },
      messageID: { type: String },
    },
    actionID: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    details: { type: Object },
  },
  { versionKey: false },
);

module.exports = model('log', LogSchema);
