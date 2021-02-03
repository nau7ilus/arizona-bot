'use strict';

const { MessageEmbed } = require('discord.js');
const Punishment = require('../models/Punishment');
const { sendErrorMessage, formatDuration } = require('../utils');
const { moderationConfig } = require('../utils/config');

exports.watchPunishments = client => {
  Object.entries(moderationConfig).forEach(async guildSettings => {
    const [guildID, settings] = guildSettings;
    if (!settings || !guildID) return;

    const guild = client.guilds.cache.get(guildID);
    if (!guild) return;

    const punishments = await Punishment.find({
      guildID: guildID,
      validUntil: { $lte: Date.now() },
    }).exec();

    punishments.forEach(punishment => {
      if (punishment.type === 0) {
        const member = guild.member(punishment.userID);
        if (!member) return;

        Punishment.findByIdAndRemove(punishment.id).exec();

        member.roles.remove(settings.mutedRole);
        // `**Cрок Вашего мута истек.\n.\n---.**`
        member.user
          .send(
            new MessageEmbed()
              .setTitle('Срок Вашего мута истек')
              .setDescription('Последующие нарушения могут привести к блокировке Вашего аккаунта'),
          )
          .catch(err => err);
      } else if (punishment.type === 1) {
        Punishment.findByIdAndRemove(punishment.id).exec();
      } else if (punishment.type === 2) {
        guild.members.unban(punishment.userID);
        Punishment.findByIdAndRemove(punishment.id).exec();
      } else if (punishment.type === 3) {
        const member = guild.member(punishment.userID);
        if (!member) return;

        Punishment.findByIdAndRemove(punishment.id).exec();

        member.roles.remove(settings.noGainExpRole);
      } else if (punishment.type === 4) {
        const channel = guild.channels.resolve(punishment.channelID);
        if (!channel) return;

        Punishment.findByIdAndRemove(punishment.id).exec();

        const overwrite = channel.permissionOverwrites.get(punishment.userID);
        if (overwrite.deny.bitfield === 0x200000 && overwrite.allow.bitfield === 0) {
          overwrite.delete();
        } else {
          overwrite.update({
            SPEAK: null,
          });
        }

        const member = guild.member(punishment.userID);
        if (member && member.voice.channel === channel) {
          member.voice.setChannel(channel);
        }
      }
    });
  });
};

exports.handleMemberAdd = async (client, member) => {
  const guild = member.guild;
  const settings = moderationConfig[guild.id];
  if (!settings) return;

  if (
    await Punishment.findOne({
      guildID: guild.id,
      userID: member.id,
      type: 0,
      validUntil: { $gte: Date.now() },
    })
  ) {
    await member.roles.add(settings.mutedRole);
  }

  if (
    await Punishment.findOne({
      guildID: guild.id,
      userID: member.id,
      type: 3,
      validUntil: { $gte: Date.now() },
    })
  ) {
    await member.roles.add(settings.noGainExpRole);
  }
};

exports.getPunishmentID = e => {
  const arr = [...e._id.id.values()];
  return arr[arr.length - 1];
};

exports.ban = async (guild, memberID, duration, reason, message) => {
  const settings = moderationConfig[guild.id];
  if (!settings) return;

  guild
    .fetchBan(memberID)
    .then(() => {
      sendErrorMessage({
        message,
        content: 'Данный пользователь уже забанен!',
        member: message.member,
      });
    })
    .catch(async () => {
      const user = await guild.members.ban(memberID, {
        reason,
      });

      const ban = new Punishment({
        guildID: guild.id,
        userID: memberID,
        moderID: message.member.id,
        type: 2,
        validUntil: Date.now() + duration,
        reason: reason || 'Не указано',
      });
      await ban.save();

      const noGainExp = new Punishment({
        guildID: guild.id,
        userID: memberID,
        moderID: message.member.id,
        type: 3,
        validUntil: Date.now() + duration + settings.noGainExpDuration,
        reason: reason || 'Не указано',
      });
      await noGainExp.save();

      message.channel.send(
        new MessageEmbed().setAuthor(`${user.username || user.id || user} был забанен на ${formatDuration(duration)}`),
      );
    });
};
