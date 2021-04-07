/* eslint-disable consistent-return */
'use strict';

const { MessageEmbed, GuildAuditLogs } = require('discord.js');
const { Actions: AuditActions } = GuildAuditLogs;
const protectionConfig = require('../utils/config').protectionConfig;

const Actions = {
  Given: 0,
  Removed: 1,
  Created: 2,
  Deleted: 3,
  Updated: 4,
};

const RoleAuditActions = {
  [Actions.Created]: AuditActions.ROLE_CREATE,
  [Actions.Deleted]: AuditActions.ROLE_DELETE,
  [Actions.Updated]: AuditActions.ROLE_UPDATE,
};

const Phrases = {
  0: 'выдал',
  1: 'снял',
  2: 'создал',
  3: 'удалил',
  4: 'обновил',
};

const endPhase = async ({ settings, executor, actionType, changedRoles, newMember }) => {
  const { guild } = executor;

  if (!settings.notifyChannel) return console.error('Notify channel not found');
  const notifyChannel = guild.channels.cache.get(settings.notifyChannel);
  if (!notifyChannel) return console.error('Notify channel not found on server');

  const embed = new MessageEmbed()
    .setColor('RED')
    .setAuthor(executor.displayName, executor.user.displayAvatarURL({ dynamic: true }))
    .setTitle('**💂 | Защита ролей**')
    .setDescription(
      `**${executor} ${Phrases[actionType]} рол${changedRoles.length === 1 ? 'ь' : 'и'} ${changedRoles
        .map(r => `<@&${r.id}>`)
        .join(', ')} ${newMember ? `пользователю ${newMember}` : ''}**`,
    )
    .addField(
      '**Снятые роли**',
      executor.roles.cache
        .filter(r => r.id !== guild.id)
        .map(i => i)
        .join('\n'),
    )
    .setFooter(executor.id)
    .setTimestamp();

  const msg = await notifyChannel.send(`**<@&${settings.notifyRoles.join('> <@&')}>**`, embed);

  await msg.react('👍');
  await msg.pin();

  await executor.roles.remove(executor.roles.cache.filter(r => r.editable));
  await executor.roles.add(settings.role);
};

const handleMemberUpdate = async (oldMember, newMember) => {
  const guild = oldMember.guild;
  if (!guild) return;

  const settings = protectionConfig[guild.id];
  if (!settings) return;

  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  if (oldRoles.size === newRoles.size) return;
  const actionType = oldRoles.size < newRoles.size ? Actions.Given : Actions.Removed;

  const changedRoles =
    actionType === Actions.Given
      ? newRoles.filter(r => !oldRoles.has(r.id))
      : oldRoles.filter(r => !newRoles.has(r.id));

  const audit = await guild.fetchAuditLogs({ type: AuditActions.MEMBER_ROLE_UPDATE });
  const entry = audit.entries.find(
    e =>
      e.target.id === newMember.id &&
      e.changes.some(c => c.key === (actionType === Actions.Given ? '$add' : '$remove')) &&
      e.changes.every(c => c.new.every(n => changedRoles.has(n.id))),
  );

  const executor = guild.member(entry.executor);
  if (!executor) return console.error('Executor not found');

  const needToHandle =
    changedRoles.some(r => !settings.allowedRoles.includes(r.id)) &&
    !executor.hasPermission('ADMINISTRATOR') &&
    !executor.roles.cache.some(r => settings.ignoreRoles.includes(r.id));
  if (!needToHandle) return;

  if (actionType === Actions.Given) newMember.roles.remove(changedRoles);
  else if (actionType === Actions.Removed) newMember.roles.add(changedRoles);

  endPhase({ settings, executor, actionType, changedRoles, newMember });
};

const handleRoleChange = async ({ actionType, oldRole, newRole, role }) => {
  const guild = oldRole ? oldRole.guild : role.guild;
  if (!guild) return;

  const settings = protectionConfig[guild.id];
  if (!settings) return;

  const audit = await guild.fetchAuditLogs({ type: RoleAuditActions[actionType] });

  // TODO: Придумать фильтр для изменения роли
  const entry = audit.entries.find(e =>
    actionType === Actions.Created
      ? !e.changes[0].old && e.changes[0].new === role.name
      : actionType === Actions.Deleted
      ? !e.changes[0].new && e.changes[0].old === role.name
      : true,
  );

  const executor = guild.member(entry.executor);
  if (!executor) return console.error('Executor not found');

  const needToHandle =
    !executor.hasPermission('ADMINISTRATOR') && !executor.roles.cache.some(r => settings.ignoreRoles.includes(r.id));
  if (!needToHandle) return;

  if (actionType === Actions.Created) {
    role.delete();
  } else if (actionType === Actions.Deleted) {
    // TODO: Исправить установку прошлой позиции
    guild.roles.create({
      data: {
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        position: role.position,
        permissions: role.permissions,
        mentionable: role.mentionable,
      },
    });
  } else if (actionType === Actions.Updated) {
    // TODO: Добавить проверку изменений и возвращать их
  }

  // TODO: Придумать, как отображать уже удаленные роли
  endPhase({ settings, executor, actionType, changedRoles: role ? [role] : [oldRole] });
};

const handleReactions = async (client, reaction, reactedUser) => {
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
  const roles = embed.fields[0].value.split('\n').map(r => r.split('<@&')[1].split('>')[0]);

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

module.exports = { Actions, handleMemberUpdate, handleReactions, handleRoleChange };
