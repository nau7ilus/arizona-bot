'use strict';

const { MessageEmbed } = require('discord.js');
const { DateTime } = require('luxon');
const { colors } = require('./constants');

exports.random = array => array[Math.floor(Math.random() * array.length)];

exports.sendErrorMessage = ({ message, content, member, emoji, react = true, color, messageType = 'embed' }) => {
  if (!emoji) emoji = exports.random(['😥', '😔', '🤔', '⚠️', '⛔', '🚫']);
  if (react) message.react(emoji);
  message.channel
    .send(
      messageType === 'plain_text'
        ? `**\`[${emoji} | Ошибка] \`${member}\`, ${content}\`**`
        : new MessageEmbed()
            .setColor(color || colors.ERROR)
            .setTitle(`**${emoji} | Произошла ошибка**`)
            .setDescription(`**${member}, ${content}**`)
            .setFooter('HamsterBot | Ошибка', message.client.user.displayAvatarURL()),
    )
    .then(msg => setTimeout(() => msg.delete(), 60 * 1000));
};

exports.onRunError = ({ client, warning, message }) => {
  console.warn(
    `[GiveRole] [Warn] Произошла ошибка в коде создания запроса Время: ${DateTime.local().toFormat('TT')}\nОшибка: ${
      warning.stack
    }`,
  );

  // Если автор команды - разработчик, отправить информацию об ошибке, иначе просто факт
  if (client.isDev(message.author.id)) {
    // Если сообщение больше, чем 1024 символа (лимит в филде в ембеде), обрезать
    const messageToString =
      message.content.length > 1024 ? `${message.content.substring(0, 1021)}...` : message.content;

    return message.channel.send(
      new MessageEmbed()
        .setColor(colors.ERROR)
        .setDescription(`**Произошла ошибка в коде системы**`)
        .addField(
          '**Отладка**',
          [
            `**Автор: ${message.author} (\`${message.author.id}\`)`,
            `Сервер: **${message.guild.name}** (\`${message.guild.id}\`)`,
            `В канале: ${message.channel} (\`${message.channel.id})**`,
          ].join('\n'),
        )
        .addField('**Сообщение:**', messageToString)
        .addField('**Ошибка**', warning.stack.length > 1024 ? `${warning.stack.substring(0, 1021)}...` : warning.stack),
    );
  } else {
    return message.channel.send(
      new MessageEmbed()
        .setColor(colors.ERROR)
        .setTitle('**🚫 | Ошибка**')
        .setDescription('**Произошла ошибка в коде команды. Сообщите разработчикам об этом**'),
    );
  }
};

exports.checkPermissions = (channel, permissions, member) => {
  const missingPermissions = [];

  // Если у бота нет прав администратора на сервере, проверяем права для бота
  if (!member.hasPermission('ADMINISTRATOR')) {
    permissions.forEach(permission => {
      if (!channel.permissionsFor(member).has(permission)) missingPermissions.push(permission);
    });
  }
  return missingPermissions;
};

exports.localizePerm = perm => {
  const russianNames = {
    CREATE_INSTANT_INVITE: 'Создавать приглашения',
    KICK_MEMBERS: 'Кикать участников',
    BAN_MEMBERS: 'Банить участников',
    ADMINISTRATOR: 'Администратор',
    MANAGE_CHANNELS: 'Управление каналами',
    MANAGE_GUILD: 'Управление сервером',
    ADD_REACTIONS: 'Добавлять реакции',
    VIEW_AUDIT_LOG: 'Просмотр журнала аудита',

    VIEW_CHANNEL: 'Читать сообщения',
    SEND_MESSAGES: 'Отправлять сообщения',
    SEND_TTS_MESSAGES: 'Отправлять TTS-сообщения',
    MANAGE_MESSAGES: 'Управление сообщениями',
    EMBED_LINKS: 'Встраивать ссылки',
    ATTACH_FILES: 'Прикреплять файлы',
    READ_MESSAGE_HISTORY: 'Читать историю сообщений',
    MENTION_EVERYONE: 'Упомянуть всех',
    USE_EXTERNAL_EMOJIS: 'Использовать внешние эмодзи',

    CONNECT: 'Подключаться в голосовые',
    SPEAK: 'Говорить в голосовых',
    MUTE_MEMBERS: 'Отключать микрофон',
    DEAFEN_MEMBERS: 'Отключать звук',
    MOVE_MEMBERS: 'Перемещать участников',
    USE_VAD: 'Приоритетный режим',

    CHANGE_NICKNAME: 'Изменить ник',
    MANAGE_NICKNAMES: 'Управление никнеймами',
    MANAGE_ROLES: 'Управление ролями',
    MANAGE_WEBHOOKS: 'Управление вебхуками',
    MANAGE_EMOJIS: 'Управление эмодзи',
  };

  return russianNames[perm];
};

exports.missingPermsError = ({ message, channel, missingPerms, emoji = '🔇', react = true, isClient = true }) => {
  const canIgnore = message.channel.id !== channel.id;
  if (!missingPerms.includes('ADD_REACTIONS') || (canIgnore && !react)) message.react(emoji);
  if (!missingPerms.includes('SEND_MESSAGES') || canIgnore) {
    message.channel
      .send(
        !missingPerms.includes('EMBED_LINKS') || canIgnore
          ? new MessageEmbed()
              .setColor(colors.ERROR)
              .setTitle(`**${emoji} | Произошла ошибка**`)
              .setDescription(
                `**У ${isClient ? 'бота' : 'вас'} нехватает прав \`
                      ${missingPerms.map(perm => exports.localizePerm(perm)).join(', ')}\` в канале <#${channel.id}>**`,
              )
          : `**\`[${emoji} | Ошибка] У бота нехватает прав '${missingPerms
              .map(perm => exports.localizePerm(perm))
              .join(', ')}' в канале '${channel.name}'\`**`,
      )
      .then(msg => setTimeout(() => msg.delete(), 25 * 1000));
  }
};

exports.resolveDuration = durationString =>
  parseInt(durationString.slice(0, -1)) *
  { s: 1000, m: 1000 * 60, h: 1000 * 60 * 60, d: 1000 * 60 * 60 * 24 }[durationString[durationString.length - 1]];

exports.formatDuration = duration => {
  let str = '';
  const days = Math.floor(duration / (24 * 60 * 60 * 1000));
  if (days !== 0) {
    if (days % 10 === 1 && days !== 11) str += `${days} день `;
    else if (days % 10 === 0 || (days >= 11 && days <= 14) || days % 10 >= 5) str += `${days} дней `;
    else if (days % 10 <= 4) str += `${days} дня `;
  }
  duration %= 24 * 60 * 60 * 1000;
  const hours = Math.floor(duration / (60 * 60 * 1000));
  if (hours !== 0) {
    if (hours % 10 === 1 && hours !== 11) str += `${hours} час `;
    else if (hours % 10 === 0 || (hours >= 11 && hours <= 14) || hours % 10 >= 5) str += `${hours} часов `;
    else if (hours % 10 <= 4) str += `${hours} часа `;
  }
  duration %= 60 * 60 * 1000;
  const minutes = Math.floor(duration / (60 * 1000));
  if (minutes !== 0) {
    if (minutes % 10 === 1 && minutes !== 11) str += `${minutes} минуту `;
    else if (minutes % 10 === 0 || (minutes >= 11 && minutes <= 14) || minutes % 10 >= 5) str += `${minutes} минут `;
    else if (minutes % 10 <= 4) str += `${minutes} минуты `;
  }
  duration %= 60 * 1000;
  const seconds = Math.floor(duration / 1000);
  if (seconds !== 0) {
    if (seconds % 10 === 1 && seconds !== 11) str += `${seconds} секунду `;
    else if (seconds % 10 === 0 || (seconds >= 11 && seconds <= 14) || seconds % 10 >= 5) str += `${seconds} секунд `;
    else if (seconds % 10 <= 4) str += `${seconds} секунды `;
  }
  return str.trim();
};
