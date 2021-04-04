'use strict';

const Command = require('../../structures/Command');
const { moderator } = require('../../handlers/rules');
const { MessageEmbed } = require('discord.js');
const rulesConfig = require('../../utils/config').rulesConfig;
const { sendErrorMessage } = require('../../utils/index');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'addpoint',
    });
  }
  // eslint-disable-next-line require-await
  async run({ args, message }) {
    const guild = message.guild;
    const settings = rulesConfig[guild.id];
    if (!settings) return;

    if (!moderator(message.member, settings)) {
      return sendErrorMessage({
        message: message,
        content: 'у вас нет прав на использование данной команды.',
        member: message.member,
        react: false,
      }); 
    }

    const channel = guild.channels.cache.get(settings.channel);
    if (!channel) return;

    const group = parseInt(args[0]);
    if (!group) {
      message.reply('**Используйте: `/addpoint [номер группы правил]`**');
      return;
    }

    console.log(group);

    const msg = (await channel.messages.fetch()).find(
      m => m.embeds && m.embeds.length !== 0 && m.embeds[0].title.startsWith(group),
    );
    if (!msg) {
      message.reply(`**Группа правил \`${group}\` не найдена.**`);
      return;
    }

    await message.channel.send(
      `**Отправьте новый пункт правил (без форматирования)
Заговолок должен соответсвовать формату, например \`1.3) Запрещено нарушать правила Discord\`
Для отмены введите \`-\`**`,
    );

    const content = await message.channel
      .awaitMessages(m => m.author.id === message.author.id, {
        max: 1,
        time: 60 * 1000,
        errors: ['time'],
      })
      .catch(() => {
        message.channel.send(`**Время на ввод истекло.**`);
      });

    if (!content || content.first().content === '-') return;

    await content.first().delete();

    if (!content.first().content.match(/(\d+\.)*\d+\) /g)) {
      message.reply(`Пункт не соответсвует формату нашей станции`);
      return;
    }

    const embed = msg.embeds[0];
    embed.setTimestamp();

    if (embed.fields[embed.fields.length - 1].value.length > 900) {
      embed.fields[embed.fields.length] = {
        name: `[${embed.fields.length}/${embed.fields.length}]`,
        value: `\`\`\`${content.first().content}\`\`\``,
      };

      for (let i = 0; i < embed.fields.length; i++) {
        embed.fields[i].name = `[${i + 1}/${embed.fields.length}]`;
      }
    } else {
      embed.fields[embed.fields.length - 1].value = `${embed.fields[embed.fields.length - 1].value.substr(
        0,
        embed.fields[embed.fields.length - 1].value.length - 3,
      )}${content.first().content}\`\`\``;
    }

    await message.channel.send(`**Предпросмотр:**`);

    await message.channel.send(embed);

    await message.channel.send(
      `**Введите \`Подтвердить\` для отправки правил в канал ${channel}.\nДля отмены введите любой другой текст**`,
    );

    const confirmation = await message.channel
      .awaitMessages(m => m.author.id === message.author.id, {
        max: 1,
        time: 60 * 1000,
        errors: ['time'],
      })
      .catch(() => {
        message.channel.send(`**Время на ввод истекло.**`);
      });

    if (!confirmation) {
      message.reply('**Подтверждено**');
      return;
    }

    await confirmation.first().delete();

    if (confirmation.first().content.trim() === 'Подтвердить') {
      message.reply('**Подтверждено**');
      msg.edit(embed);
    }
  }
};
