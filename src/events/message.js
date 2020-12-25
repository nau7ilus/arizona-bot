'use strict';

const { onRunError, sendErrorMessage, checkPermissions, missingPermsError } = require('../utils');

module.exports = (client, message) => {
  if (message.type === 'PINS_ADD' && message.channel.id === process.env.REQUESTS_CHANNEL) {
    message.delete();
  }

  if (message.author.bot || message.system || !message.guild) return;

  require('../handlers/levels-handler').handleMessage(message);
  require('../handlers/suggestions').handleMessage(message);

  // Получаем префикс бота из базы данных. По умолчанию '/'
  if (!message.content.startsWith('/')) return;

  // Заменяем массовые упоминания на обычный текст
  message.content = message.content.replace(/@everyone/g, '**everyone**');
  message.content = message.content.replace(/@here/g, '**here**');

  // Делим сообщение на аргументы, убирая пробелы между словами. Получаем массив
  const args = message.content.slice(1).trim().split(/ +/g);

  // Находим команду в базе данных
  const cmdName = args[0].toLowerCase().normalize();
  args.shift();

  const cmd = client.commands.find(c => c.name === cmdName || (c.aliases && c.aliases.includes(cmdName)) || null);

  if (cmd) {
    // Если команда только для разработчиков, а у автора нет прав, дать ошибку
    if (!client.isDev(message.author.id) && (['dev'].includes(cmd.category) || cmd.devOnly)) {
      sendErrorMessage({
        message,
        content: 'у вас нет прав на использование этой команды',
        member: message.member,
      });

      console.log(
        '[Message] %s попытался использовать команду для разработчиков %s %s',
        message.author.tag,
        cmd.name,
        message.guild ? `на сервере ${message.guild.name} в канале ${message.channel.name}` : `в личных сообщениях`,
      );
      return;
    }

    console.log(
      `[Message] ${message.author.tag} использовал команду ${cmd.name} ${
        message.guild ? `на сервере ${message.guild.name} в канале ${message.channel.name}` : `в личных сообщениях`
      }`,
    );

    // Проверяем наличие прав у пользователя/бота (TODO: необходим рефакторинг)
    const has = Object.prototype.hasOwnProperty;
    if (has.call(cmd, 'userPermissions')) {
      const missingPerms = checkPermissions(message.channel, cmd.userPermissions, message.member);
      if (missingPerms.length > 0) {
        missingPermsError({ message, channel: message.channel, missingPerms, isClient: false });
      }
    }
    if (has.call(cmd, 'clientPermissions')) {
      const missingPerms = checkPermissions(message.channel, cmd.userPermissions, message.member);
      if (missingPerms.length > 0) {
        missingPermsError({ message, channel: message.channel, missingPerms });
      }
    }

    // Если команда требует NSFW у канала, а его нет, отправить ошибку
    if (cmd.nsfw && !message.channel.nsfw) {
      sendErrorMessage({
        message,
        content: 'эта команда доступна только в NSFW каналах',
        member: message.member,
        emoji: '🔞',
      });
      return;
    }

    cmd.run({ client, message, args }).catch(warning => onRunError({ warning, client, message }));
  }
};
