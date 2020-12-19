'use strict';

const { MessageEmbed } = require('discord.js');
const { levelsConfig } = require('../utils/config');

const sendMessage = (member, message, color = '#66ffad') => {
  if (!levelsConfig[member.guild.id]) return;

  const embed = new MessageEmbed()
    .setColor(color)
    .setAuthor(member.displayName, member.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`**${message}**`)
    .setTimestamp();

  member.send(embed).catch(err => {
    if (err.code !== 50007) return;
    const generalChannel = member.guild.channels.cache.get('772976414945181717');
    generalChannel.send(member, embed);
  });
};

const giveLevelRole = async (member, level = 1, sendMsg = false) => {
  if (!levelsConfig[member.guild.id]) return;

  const rolesByLevel = levelsConfig[member.guild.id].rolesByLevel;
  const blacklistedRoles = levelsConfig[member.guild.id].blacklistedRoles;

  if (!member) throw new Error('Пользователь пропал');

  if (member.roles.cache.some(r => blacklistedRoles.includes(r.id))) return;

  const roleData =
    rolesByLevel.find((j, i) => level >= j.level && rolesByLevel[i + 1] && level < rolesByLevel[i + 1].level) ||
    rolesByLevel[rolesByLevel.length - 1];

  if (!roleData) {
    throw new Error('Не удалось найти ID роли для выдачи для выдачи #1');
  }

  const role = member.guild.roles.cache.get(roleData.roleID);
  if (!role) {
    throw new Error('Не удалось найти роль для выдачи на сервере #2');
  }

  rolesByLevel.forEach(async i => {
    if (i.roleID === roleData.roleID || !member.roles.cache.get(i.roleID)) return;
    await member.roles.remove(i.roleID);
  });

  if (sendMsg && member.roles.cache.some(r => r.id === role.id)) {
    sendMessage(
      member,
      `Поздравляем, вы получили ${level} уровень!\nС дальнейшем повышением уровня вы получите различные плюшки!`,
    );
    return;
  }

  await member.roles.add(role, `Повышение уровня на ${level}`);
  if (sendMsg) {
    sendMessage(
      member,
      `Поздравляем, вы получили ${level} уровень!\nЗа общение в чате ты получаешь роль \`${role.name}\``,
      role.color,
    );
  }
};

const handleMessage = async message => {
  if (!levelsConfig[message.guild.id]) return;

  const member = message.mentions.members.first();
  const level = +message.content.split('|')[1];

  if (isNaN(level)) throw new Error('Уровень не парсится');
  if (!member) throw new Error('Пользователь пропал');

  await giveLevelRole(member, level, true);
};

module.exports = { giveLevelRole, handleMessage };
