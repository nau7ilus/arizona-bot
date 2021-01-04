'use strict';

const rolebyreactionConfig = require('../utils/config').rolebyreactionConfig;

exports.handleReactions = async (client, reaction, reactedUser) => {
  const guild = reaction.message.guild;
  // Поиск настроек
  const settings = rolebyreactionConfig[guild.id];
  if (!settings) return;

  if (reactedUser.bot) return;

  // Проверка, на сервере ли пользователь
  const executor = guild.member(reactedUser);
  if (!executor) return;

  // Валидация сообщения
  const message = reaction.message;
  if (
    message.channel.id !== settings.channel ||
    message.author !== client.user ||
    !message.embeds ||
    message.embeds.length === 0
  ) {
    return;
  }

  // Если не тот embed return
  const embed = message.embeds[0];
  if (
    embed.title !== settings.embed.title ||
    embed.description !== settings.embed.description ||
    embed.color !== settings.embed.color ||
    embed.footer.text !== settings.embed.footer
  ) {
    return;
  }

  // Проверка правильности эмодзи
  if (reaction.emoji.name !== settings.emoji) {
    reaction.users.remove(reactedUser);
    return;
  }

  const role = guild.roles.resolve(settings.role);

  if (!role) return;

  // Если уже есть роль возвращаем
  if (executor.roles.cache.has(role)) return;

  await executor.roles.add(role);
};
