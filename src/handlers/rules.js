'use strict';

const { MessageEmbed } = require('discord.js');
const rulesConfig = require('../utils/config').rulesConfig;

exports.moderator = (member, settings) =>
  member.hasPermission('ADMINISTRATOR') || member.roles.cache.some(r => settings.moderators.includes(r.id));

  exports.action = async (message, action) => {
    const settings = rulesConfig[message.guild.id];
    if (!settings) return;
  
    if (!exports.moderator(message.member, settings)) {
      return message.channel.send(
        message.member,
        new MessageEmbed().setColor('RED').setTitle('У вас нет прав на использование данной команды'),
      );
    }
  };