'use strict';

const Command = require('../../structures/Command');
const rulesConfig = require('../../utils/config').rulesConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'editrules',
      devOnly: true,
    });
  }
  // eslint-disable-next-line require-await
  async run({ args, message }) {
    const guild = message.guild;
    const settings = rulesConfig[guild.id];
    if (!settings) return;

    const channel = guild.channels.cache.get(settings.channel);
    if (!channel) return;

    const group = parseInt(args[0]);
    if (!group) {
      message.reply('**Используйте: `/editrules [номер группы правил]`**');
      return;
    }

    const msg = (await channel.messages.fetch()).find(
      m => m.embeds && m.embeds.length !== 0 && m.embeds[0].title.startsWith(group),
    );
    if (!msg) {
      message.reply(`**Группа правил \`${group}\` не найдена.**`);
      return;
    }

    await message.channel.send(`**Отправьте новое содержимое группы правил (без форматирования)
Для отмены введите \`-\`**`);

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

    const contentText = content.first().content.trim();

    const fields = [];
    let current = 0;
    fields[current] = {
      value: '```',
    };
    contentText.split('\n').forEach(elem => {
      if (fields[current].value.length > 900) {
        current++;
        fields[current] = {
          value: '```',
        };
      }

      fields[current].value += `${elem}\n`;
    });

    for (let i = 0; i < fields.length; i++) {
      fields[i].name = `[${i + 1}/${fields.length}]`;
      fields[i].value += '```';
    }

    const embed = msg.embeds[0];
    embed.fields = fields;
    embed.setTimestamp();

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
