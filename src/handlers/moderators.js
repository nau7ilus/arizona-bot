'use strict';

const { MessageEmbed } = require('discord.js');
const Punishment = require('../models/Punishment');
const { moderationConfig } = require('../utils/config');

exports.watchMutes = client => {
  Object.entries(moderationConfig).forEach(async guildSettings => {
    const [guildID, settings] = guildSettings;
    if (!settings || !guildID) return;

    const guild = client.guilds.cache.get(guildID);
    if (!guild) return;

    const mutes = await Punishment.find({
      guildID: guildID,
      validUntil: { $lte: Date.now() },
    }).exec();

    console.log(mutes);

    mutes.forEach(mute => {
      const member = guild.member(mute.userID);
      if (!member) return;

      member.roles.remove(settings.mutedRole);
      console.log(`${new Date().toLocaleString()} | ${member.displayName} now unmuted`);
    });
  });
};
