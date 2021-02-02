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
      type: 0,
      validUntil: { $lte: Date.now() },
    }).exec();

    mutes.forEach(mute => {
      const member = guild.member(mute.userID);
      if (!member) return;

      Punishment.findByIdAndRemove(mute.id).exec();

      member.roles.remove(settings.mutedRole);
      // `**Cрок Вашего мута истек.\n.\n---.**`
      member.user
        .send(
          new MessageEmbed()
            .setTitle('Срок Вашего мута истек')
            .setDescription('Последующие нарушения могут привести к блокировке Вашего аккаунта'),
        )
        .catch(err => err);
    });
  });
};

exports.handleMemberAdd = async (client, member) => {
  const guild = member.guild;
  const settings = moderationConfig[guild.id];
  if (!settings) return;

  const mute = await Punishment.findOne({
    guildID: guild.id,
    userID: member.id,
    type: 0,
    validUntil: { $gte: Date.now() },
  });

  const role = guild.roles.cache.get(settings.mutedRole);
  if (!role) throw new Error('Роль Muted для этого сервера не найдена');

  if (mute) {
    await member.roles.add(role);
  }
};
