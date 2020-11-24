'use strict';

const { MessageEmbed } = require('discord.js');

const rolesByLevel = [
  { level: 1, roleID: '772869388155486253' },
  { level: 10, roleID: '772869388155486254' },
  { level: 15, roleID: '772869388155486255' },
  { level: 20, roleID: '772869388155486256' },
  { level: 30, roleID: '772869388155486257' },
  { level: 40, roleID: '772869388155486258' },
  { level: 50, roleID: '772869388163743844' },
  { level: 55, roleID: '772869388163743845' },
];

const blacklistedRoles = [
  '772869388331515950',
  '772869388331515949',
  '772869388331515948',
  '772869388331515947',
  '772869388310806572',
  '772869388310806571',
  '772869388310806570',
  '772869388310806569',
];

const sendMessage = (member, message, color = '#66ffad') => {
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
  if (!member) throw new Error('Пользователь пропал');

  if (member.roles.some(r => blacklistedRoles.includes(r.id))) return;

  const roleData =
    rolesByLevel.find(
      (j, i) => level >= j.level && rolesByLevel[i + 1] && level < rolesByLevel[i + 1].level,
    ) || rolesByLevel[rolesByLevel.length - 1];

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
      `Поздравляем, вы получили ${level} уровень!\n` +
        `С дальнейшем повышением уровня вы получите различные плюшки!`,
    );
    return;
  }

  await member.roles.add(role, `Повышение уровня на ${level}`);
  if (sendMsg) {
    sendMessage(
      member,
      `Поздравляем, вы получили ${level} уровень!\n` +
        `За общение в чате ты получаешь роль \`${role.name}\``,
      role.color,
    );
  }
};

const handleMessage = async message => {
  const member = message.mentions.members.first();
  const level = +message.content.split('|')[1];

  if (isNaN(level)) throw new Error('Уровень не парсится');
  if (!member) throw new Error('Пользователь пропал');

  await giveLevelRole(member, level, true);
};

module.exports = { rolesByLevel, giveLevelRole, handleMessage };
