/* eslint-disable consistent-return */
'use strict';

const plural = require('plural-ru');
const rolesConfig = require('../utils/config').roles;

const ROLES = key => plural.verb(key, `%d роль`, `%d роли`, `%d ролей`);
const ADDED = key => plural.verb(key, `выдана`, `выдано`, `выдано`);
const REMOVED = key => plural.verb(key, `снята`, `снято`, `снято`);

exports.handleMessage = message => {
  if (!message.content.startsWith('/a_') && !message.content.startsWith('/d_')) return;

  const settings = rolesConfig[message.guild.id];
  if (!settings) return;

  const giveRoles = message.content.startsWith('/a_');

  const args = message.content.trim().split(/ +/g);
  const specifiedCat = args[0].split(giveRoles ? '/a_' : '/d_')[1];
  if (!specifiedCat) {
    return message.reply(`укажите, какую роль необходимо ${giveRoles ? 'выдать' : 'снять'}`);
  }

  const catSettings = settings[specifiedCat];
  if (!catSettings) {
    return message.reply(`категория **${specifiedCat}** не найдена в настройках сервера`);
  }

  if (
    !message.member.hasPermission('ADMINISTRATOR') &&
    !message.member.roles.some(r => catSettings.manage.includes(r.id))
  ) {
    return message.reply('у вас нет доступа к данной категории');
  }

  const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
  if (!member) {
    return message.reply(`вы не указали пользователя`);
  }

  if (giveRoles) {
    exports.giveRoles(message, member, catSettings.give);
  } else {
    exports.removeRoles(message, member, catSettings.give);
  }
};

// Дубликат кода, желательно переделать под одну функцию
// Проверять, есть ли у пользователя те роли, которые необходимо снять/выдать
// Добавить проверку наличия ролей на сервере
// Добавить проверку наличия прав у бота на управление необходимыми ролями
// Хендлинг ошибок

exports.giveRoles = async (message, member, roles) => {
  const msg = await message.reply('загрузка...');

  for await (const role of roles) {
    member.roles.add(role, `[Выдача ролей по команде] Запрошено ${message.member.displayName}`);
  }

  msg.edit(
    `${message.member}, успешно ${ADDED(roles.length)} ${ROLES(roles.length)} **\`(${roles.map(
      r => message.guild.roles.cache.get(r).name || 'Не найдено',
    )})\`**`,
  );
};

exports.removeRoles = async (message, member, roles) => {
  const msg = await message.reply('загрузка...');

  for await (const role of roles) {
    member.roles.remove(role, `[Снятие ролей по команде] Запрошено ${message.member.displayName}`);
  }

  msg.edit(
    `${message.member}, успешно ${REMOVED(roles.length)} ${ROLES(roles.length)} **\`(${roles
      .map(r => message.guild.roles.cache.get(r).name || 'Не найдено')
      .join(', ')})\`**`,
  );
};
