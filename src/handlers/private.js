'use strict';

const { MessageEmbed } = require('discord.js');
const privateConfig = require('../utils/config').privateConfig;

const usercd = new Set();
const servercd = new Set();
const errormsgcd = new Set();

module.exports.handleVoiceStateUpdate = async (client, oldState, newState) => {
  const guild = newState.guild;
  const settings = privateConfig[guild.id];
  if (!settings) return;

  const category = guild.channels.cache.get(settings.category);
  if (!category) return;

  const channel = guild.channels.cache.get(settings.channel);
  if (!channel) return;

  // Если пользователь отключился
  if (oldState.channel) {
    if (
      oldState.channel.id !== channel.id &&
      oldState.channel.parent &&
      oldState.channel.parent.id === category.id &&
      oldState.channel.members.every(m => m.user.bot)
    ) {
      oldState.channel.delete();
    }
  }

  // Если пользователь подключился
  if (newState.channel) {
    if (newState.channel.id === channel.id) {
      if (Date.now() - newState.member.joinedAt < 10 * 60 * 1000) {
        sendErrorMessage(newState.member, settings);
        newState.kick();
        return;
      }

      if (usercd.has(newState.member.id)) {
        sendErrorMessage(newState.member, settings);
        newState.kick();
        return;
      }
      if (servercd.has(guild.id)) {
        sendErrorMessage(newState.member, settings);
        newState.kick();
        return;
      }

      if (category.children.filter(ch => ch.id !== settings.channel).length >= settings.limits.privates) {
        sendErrorMessage(newState.member, settings);
        newState.kick();
        return;
      }

      if (category.children.some(ch => ch.permissionOverwrites.some(p => p.id === newState.member.id))) {
        newState.setChannel(
          category.children.find(ch => ch.permissionOverwrites.some(p => p.id === newState.member.id)),
        );
        return;
      }

      usercd.add(newState.member.id);
      servercd.add(guild.id);

      setTimeout(() => {
        usercd.delete(newState.member.id);
      }, settings.limits.usercooldown);
      setTimeout(() => {
        servercd.delete(guild.id);
      }, settings.limits.guildcooldown);

      const ch = await guild.channels.create(newState.member.displayName, {
        type: 'voice',
        parent: category,
        permissionOverwrites: [
          ...category.permissionOverwrites.toJSON(),
          {
            id: newState.member.id,
            allow: ['CONNECT', 'SPEAK', 'USE_VAD', 'MANAGE_CHANNELS'],
          },
        ],
      });

      await newState.setChannel(ch);
    }
  }
};

// eslint-disable-next-line require-await
module.exports.watchPrivates = async client => {
  Object.keys(privateConfig).forEach(id => {
    const guild = client.guilds.cache.get(id);
    if (!guild) return;

    const settings = privateConfig[id];
    if (!settings) return;

    const category = guild.channels.cache.get(settings.category);
    if (!category) return;

    category.children
      .filter(c => c.id !== settings.channel)
      .forEach(ch => {
        if (ch.members.every(m => m.user.bot)) {
          ch.delete();
        }
      });
  });
};

function sendErrorMessage(member, settings) {
  if (errormsgcd.has(member.id)) return;

  const embed = new MessageEmbed()
    .setTitle('Ошибка')
    .setColor('RED')
    .setDescription('**Вы не можете в данный момент создать приват.\nПожалуйста, попробуйте через несколько минут.**')
    .setTimestamp();
  member.user
    .send(embed)
    .then(msg => msg.delete({ timeout: 10000 }))
    .catch(() => {
      member.guild.channels.cache
        .get(settings.notifyChannel)
        .send(member, embed)
        .then(msg => msg.delete({ timeout: 10000 }));
    });

  errormsgcd.add(member.id);
  setTimeout(() => {
    errormsgcd.delete(member.id);
  }, 60 * 1000);
}
