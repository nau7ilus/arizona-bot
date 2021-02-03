'use strict';

const { MessageEmbed } = require('discord.js');
const { ban } = require('../../handlers/moderators');
const Command = require('../../structures/Command');
const { resolveDuration, sendErrorMessage } = require('../../utils');
const { moderationConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'voteban',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
      arguments: {
        member: {
          type: 'user',
          required: true,
        },
        duration: {
          type: 'time',
          required: true,
        },
        reason: {
          type: 'spaceString',
        },
      },
    });
  }
  async run({ args, message }) {
    const guild = message.guild;

    const settings = moderationConfig[guild.id];
    if (!settings) return;

    if (!settings.allowedRoles.includes(this.name)) {
      sendErrorMessage({
        message,
        content: 'Недоступно на этом сервере!',
        member: message.member,
      });
      return;
    }

    const [memberString, durationString, reason] = args;

    const duration = resolveDuration(durationString);

    const memberID = memberString.match(/\d{18}/)[0];

    if (
      !message.member.hasPermission('ADMINISTRATOR') &&
      !message.member.roles.cache.some(r => settings.moderatorRoles.includes(r.id))
    ) {
      sendErrorMessage({
        message,
        content: 'У вас нет прав!',
        member: message.member,
      });
      return;
    }

    const member = guild.member(memberID);

    if (
      member &&
      (member.user.bot ||
        member.hasPermission('ADMINISTRATOR') ||
        member.roles.cache.some(r => settings.inviolableRoles.includes(r.id)))
    ) {
      sendErrorMessage({
        message,
        content: 'Вы не можете забанить этого пользователя!',
        member: message.member,
      });
      return;
    }

    const msg = await message.channel.send(
      new MessageEmbed().setTitle(`Голосование за бан пользователя ${member || memberID}`).setColor('YELLOW'),
    );

    await msg.react('✅');
    await msg.react('❌');
    const collector = msg.createReactionCollector(
      (reaction, user) =>
        !user.bot &&
        (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') &&
        (guild.member(user).hasPermission('ADMINISTRATOR') ||
          guild.member(user).roles.cache.some(r => settings.moderatorRoles.includes(r.id))),
    );

    collector.on('collect', (reaction, user) => {
      if (
        guild.member(user).hasPermission('ADMINISTRATOR') ||
        guild.member(user).roles.cache.some(r => settings.headModeratorRoles.includes(r.id))
      ) {
        if (reaction.emoji.name === '✅') {
          resolveBan(guild, message, memberID, duration, reason, msg, [user]);
          collector.stop();
          return;
        } else if (reaction.emoji.name === '❌') {
          rejectBan(guild, message, memberID, msg, [user]);
          collector.stop();
          return;
        }
      }

      if (
        collector.collected.has('❌') &&
        collector.collected
          .get('❌')
          .users.cache.filter(
            u =>
              !u.bot &&
              (guild.member(u).hasPermission('ADMINISTRATOR') ||
                guild.member(u).roles.cache.some(r => settings.moderatorRoles.includes(r.id))),
          ).size >= settings.usersForRejectVoteban
      ) {
        rejectBan(
          guild,
          message,
          memberID,
          msg,
          collector.collected
            .get('❌')
            .users.cache.filter(
              u =>
                !u.bot &&
                (guild.member(u).hasPermission('ADMINISTRATOR') ||
                  guild.member(u).roles.cache.some(r => settings.moderatorRoles.includes(r.id))),
            ),
        );
        collector.stop();
      } else if (
        collector.collected.has('✅') &&
        collector.collected
          .get('✅')
          .users.cache.filter(
            u =>
              !u.bot &&
              (guild.member(u).hasPermission('ADMINISTRATOR') ||
                guild.member(u).roles.cache.some(r => settings.moderatorRoles.includes(r.id))),
          ).size >= settings.usersForVoteban
      ) {
        resolveBan(
          guild,
          message,
          memberID,
          duration,
          reason,
          msg,
          collector.collected
            .get('✅')
            .users.cache.filter(
              u =>
                !u.bot &&
                (guild.member(u).hasPermission('ADMINISTRATOR') ||
                  guild.member(u).roles.cache.some(r => settings.moderatorRoles.includes(r.id))),
            ),
        );
        collector.stop();
      }
    });
  }
};

function resolveBan(guild, message, memberID, duration, reason, msg, users) {
  msg.edit(
    msg.embeds[0]
      .setTitle(`Голосование за бан пользователя ${guild.member(memberID) || memberID} завершено`)
      .setDescription(users.map(e => e.toString()).join('\n'))
      .setColor('GREEN'),
  );

  ban(guild, memberID, duration, reason, message);
}

function rejectBan(guild, message, memberID, msg, users) {
  msg.edit(
    msg.embeds[0]
      .setTitle(`Голосование за бан пользователя ${guild.member(memberID) || memberID} отменено`)
      .setDescription(users.map(e => e.toString()).join('\n'))
      .setColor('RED'),
  );
}
