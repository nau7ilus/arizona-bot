'use strict';

const { MessageEmbed } = require('discord.js');
const plural = require('plural-ru');
const Command = require('../../structures/Command');
const meetingConfig = require('../../utils/config').meetingConfig[process.env.GUILD_ID];

const PEOPLE = key => plural(key, `%d человек`, `%d человека`, `%d человек`);

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'meeting',
    });
  }

  // eslint-disable-next-line consistent-return
  async run({ message }) {
    // Проверка наличия конфига
    if (!meetingConfig) {
      return this.sendError(message, 'Настройки для этого сервера не найдены');
    }

    // Проверить, есть ли пользователь в голосовом канале
    if (!message.member.voice.channelID) {
      return this.sendError(
        message,
        'Для использования команды, вы должны быть в голосовом канале',
      );
    }

    // Поиск настроек для канала, в котором находится пользователь
    const settings = meetingConfig.find(c => c.channel === message.member.voice.channelID);
    if (!settings) {
      return this.sendError(message, 'Данный канал не указан в настройках');
    }

    // Проверка наличия прав на использование команды
    if (!this.isManager(message.member, settings.manageRoles)) {
      return this.sendError(message, 'У вас нет прав на использование команды в этом канале');
    }

    // Если надо проверить одобренные прогулы
    if (settings.type === 1) {
      // Поиск канала для пропусков
      const skipChannel = message.guild.channels.cache.get(settings.skipChannel);
      if (!skipChannel) {
        return this.sendError(message, 'Канал для пропусков не найден на сервере');
      }

      // Поиск сообщений о пропуске в канале после последнего сообщения '+'
      const fetchedMessages = await skipChannel.messages.fetch({ limit: 50 });
      const lastManagerMessage = fetchedMessages.find(msg => msg.content === '+');
      const skipMessages = await skipChannel.messages.fetch({
        after: lastManagerMessage ? lastManagerMessage.id : undefined,
      });

      // Пользователи, которым разрешен прогул
      const allowedTruancy = skipMessages.map(m => m.author.id);

      // Прогульщики
      const truants = [];

      for (const roleID of settings.userRoles) {
        // Поиск роли на сервере. Если ее нет, отправить варнинг
        const role = message.guild.roles.cache.get(roleID);
        if (!role) {
          return this.sendWarning(message, `Роль \`${roleID}\` не найдена на сервере`);
        }

        // Проверка всех пользователей с ролью, которые не отписали в канал пропуска
        // на пристутствие в голосовом канале
        const roleMembers = role.members.filter(
          m => !allowedTruancy.includes(m.id) && !m.displayName.toLowerCase().includes('неактив'),
        );

        roleMembers.forEach(m => {
          if (!m.voice.channelID || m.voice.channelID !== settings.channel) {
            truants.push(m);
          }
        });
      }

      // Отправление итогов
      message.channel.send(
        new MessageEmbed()
          .setColor(settings.color)
          .setTitle(`**${message.member.voice.channel.name}**`)
          .setDescription(
            `**\`\`\`На собрании присутствует: ${PEOPLE(
              message.member.voice.channel.members.size,
            )}\nНа собрании отсутствует: ${PEOPLE(
              truants.length + allowedTruancy.length,
            )}\nИз которых отписали в канал: ${PEOPLE(
              allowedTruancy.length,
            )}\`\`\`\nПрогульщики:\n${truants
              .map(m => `${m.toString()} \`(${m.displayName})\``)
              .join('\n')}**`,
          ),
      );
    } else if (settings.type === 0) {
      const members = {};

      message.member.voice.channel.members.forEach(m => {
        const role = m.roles.cache.find(r =>
          [...settings.userRoles, ...settings.manageRoles].includes(r.id),
        );

        if (!members[role ? role.name : -1]) {
          members[role ? role.name : -1] = [];
        }
        members[role ? role.name : -1].push(m);
      });

      message.channel.send(
        new MessageEmbed()
          .setColor(settings.color)
          .setTitle(`**${message.member.voice.channel.name}**`)
          .setDescription(
            `**\`\`\`На собрании присутствует: ${PEOPLE(
              message.member.voice.channel.members.size,
            )}\`\`\`${Object.entries(members)
              .sort()
              .reverse()
              .map(
                i =>
                  `\n\n\`\`\`${+i[0] === -1 ? 'Остальные' : i[0]} - ${PEOPLE(
                    i[1].length,
                  )}\`\`\`${i[1].map(m => `${m.toString()} \`${m.displayName}\``).join('\n')}`,
              )}**`,
          ),
      );
    }
  }

  isManager(member, manageRoles) {
    return (
      member.hasPermission('ADMINISTRATOR') ||
      member.roles.cache.some(r => manageRoles.includes(r.id))
    );
  }

  sendWarning(message, content = 'Неизвестная ошибка') {
    message.channel
      .send(message.member, new MessageEmbed().setColor(0xebb734).setTitle(content))
      .then(msg => msg.delete({ timeout: 15000 }));
  }

  sendError(message, content = 'Неизвестная ошибка') {
    message.channel
      .send(message.member, new MessageEmbed().setColor(0xff3636).setTitle(content))
      .then(msg => msg.delete({ timeout: 15000 }));
  }
};
