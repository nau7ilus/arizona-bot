'use strict';

const { MessageEmbed } = require('discord.js');
const rulesConfig = require('../utils/config').rulesConfig;

exports.moderator = (member, settings) =>
  member.hasPermission('ADMINISTRATOR') || member.roles.cache.some(r => settings.moderators.includes(r.id));

  exports.action = async (message, action) => {
    const settings = rulesConfig[message.guild.id];
    if (!settings) return;
  
    if (!exports.moderator(message.member, settings)) {
        return sendErrorMessage({
            message: message,
            content: 'у вас нет прав на использование данной команды.',
            member: message.member,
            react: false,
          }); 
        }
    }