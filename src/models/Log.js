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
 * Suggestions:
 * 15. Approve
 * 16. Consider
 * 17. Deny
 * 18. Implement
 *
 * Support:
 * 19. Active
 * 20. Close
 * 21. Hold
 */

const LogSchema = new Schema(
  {
    origin: { type: String, required: true },
    target: { type: String, required: true },
    discordData: {
      guildsID: { type: [String] },
      channelsID: { type: [String] },
      messagesID: { type: [String] },
      usersID: { type: [String] },
    },
    actionID: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    details: { type: Object },
  },
  { versionKey: false },
);

module.exports = model('log', LogSchema);
