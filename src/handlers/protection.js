'use strict';

const { MessageEmbed } = require('discord.js');
const protectionConfig = require('../utils/config').protectionConfig;

exports.handleMemberUpdate = async (client, oldMember, newMember) => {
  const guild = oldMember.guild;
  if (!guild) return;

  // Подключение настроек, если их не существует return
  const settings = protectionConfig[guild.id];
  if (!settings) return;

  // Если роли добавились
  if (oldMember.roles.cache.size < newMember.roles.cache.size) {
    const newRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id) && r.id !== guild.id);

    // Обнаружение нарушителя
    const audit = await guild.fetchAuditLogs({ type: 25 });
    const entry = audit.entries.find(
      e =>
        e.target.id === newMember.id &&
        e.changes.some(change => change.key === '$add' && change.new.every(role => newRoles.has(role.id))),
    );
    const executor = guild.member(entry.executor);

    // Проверка прав нарушителя
    if (
      executor.hasPermission('ADMINISTRATOR') ||
      executor.roles.cache.some(r => settings.allowedRoles.includes(r.id))
    ) {
      return;
    }

    // Если выдана запрещенная роль
    if (newRoles.some(r => settings.bannedRoles.includes(r.id))) {
      // Сохранение старых ролей пользователя
      const oldRoles = executor.roles.cache.filter(
        r => (executor.id !== newMember.id || !newRoles.has(r.id)) && r.id !== guild.id,
      );
      const oldRolesID = [];
      oldRoles.forEach(r => oldRolesID.push(r.id));

      // Преобразование выданных ролей в строку
      const newRolesString = [];
      newRoles.forEach(r => newRolesString.push(r.toString()));

      const channel = guild.channels.cache.get(settings.notifyChannel);

      // Формирование embed
      const embed = new MessageEmbed()
        .setColor('RED')
        .setAuthor(executor.displayName, executor.user.avatarURL())
        .setTitle('Снят системой безопасности')
        .setDescription(
          `**${executor} выдал рол${newRolesString.length === 1 ? 'ь' : 'и'}:
          ${newRolesString.join(' ')}
          Пользователю ${newMember}**`,
        )
        .addField('Снятые роли', oldRolesID.join('\n'))
        .setFooter(executor.id)
        .setTimestamp();

      const msg = await channel.send(`<@&${settings.notifyRoles.join('> <&')}>`, embed);

      await msg.react('👍');
      await msg.pin();

      await newMember.roles.remove(newRoles);
      await executor.roles.remove(executor.roles.cache.filter(r => !r.managed));
      await executor.roles.add(settings.role);
    }
  }
};

exports.handleReactions = async (client, reaction, reactedUser) => {
  const guild = reaction.message.guild;
  // Поиск настроек
  const settings = protectionConfig[guild.id];
  if (!settings) return;

  if (reactedUser.bot) return;

  // Проверка, на сервере ли пользователь
  const executor = guild.member(reactedUser);
  if (!executor) return;

  // Валидация сообщения
  const message = reaction.message;
  if (
    message.channel.id !== settings.notifyChannel ||
    message.author !== client.user ||
    !message.embeds ||
    message.embeds.length === 0
  ) {
    return;
  }

  // Если не тот embed return
  const embed = message.embeds[0];
  if (embed.title !== 'Снят системой безопасности') return;

  // Проверка прав пользователя
  if (
    !executor.hasPermission('ADMINISTRATOR') &&
    !executor.roles.cache.some(role => settings.notifyRoles.includes(role.id))
  ) {
    reaction.users.remove(reactedUser);
    return;
  }

  // Проверка правильности эмодзи
  if (reaction.emoji.name !== '👍') {
    reaction.users.remove(reactedUser);
    return;
  }

  // Поиск нарушителя
  const member = guild.member(embed.footer.text);
  if (!member) return;

  // Формирование массива потерянных ролей
  const rolesID = embed.fields[0].value.split('\n');
  const roles = [];
  rolesID.forEach(id => roles.push(guild.roles.cache.get(id)));

  // Изменение сообщения с embed'ом
  embed
    .setColor('GREEN')
    .setTitle('Снят системой безопасности (Восстановлен)')
    .addField('Обновлено', `**Роли восстановлены администратором ${executor}**`);

  await message.edit(embed);

  // Уведомление о том, что роли восстановлены
  await member.user.send(`**Ваши роли были восстановлены! Не нарушайте больше!**`);

  // Возвращение ролей
  await member.roles.add(roles);

  // Снятие роли снят системой безопасности
  await member.roles.remove(settings.role);

  // Подчистка сообщения
  await message.reactions.removeAll();
  await message.unpin();
};
