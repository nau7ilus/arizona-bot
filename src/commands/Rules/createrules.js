'use strict';

const fs = require('fs');
const https = require('https');
const { MessageEmbed } = require('discord.js');
const Command = require('../../structures/Command');
const rulesConfig = require('../../utils/config').rulesConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'createrules',
      devOnly: true,
    });
  }
  // eslint-disable-next-line require-await
  async run({ message }) {
    const guild = message.guild;
    const settings = rulesConfig[guild.id];
    if (!settings) return;

    const channel = guild.channels.cache.get(settings.channel);
    if (!channel) return;

    await message.channel.send(
      `**Отправьте заголовок группы правил (без форматирования)
Заговолок должен начинаться с цифры, например \`1. Правила текстовых каналов\`
Для отмены введите \`-\`**`,
    );

    const title = await message.channel
      .awaitMessages(m => m.author.id === message.author.id, {
        max: 1,
        time: 60 * 1000,
        errors: ['time'],
      })
      .catch(() => {
        message.channel.send(`**Время на ввод истекло.**`);
      });

    if (!title || title.first().content === '-') return;

    await title.first().delete();

    await message.channel.send(`**Отправьте содержимое группы правил (без форматирования)
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

    const contentText =
      content.first().attachments && content.first().attachments.size !== 0
        ? await getAttachmentContent(content.first().attachments.first())
        : content.first().content.trim();

    await content.first().delete();

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

    const embed = new MessageEmbed()
      .setTitle(title.first().content.trim())
      .addFields(fields)
      .setColor('GREEN')
      .setFooter('Powered by HamsterBot | Последнее обновление правил')
      .setTimestamp();

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
      message.reply('**Отменено**');
      return;
    }

    await confirmation.first().delete();

    if (confirmation.first().content.trim() === 'Подтвердить') {
      message.reply('**Подтверждено**');
      channel.send(embed);
    } else {
      message.reply('**Отменено**');
    }
  }
};

function getAttachmentContent(attachment) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path, { flags: 'wx' });
    const path = `tmp_${attachment.id}.txt`;

    const request = https.get(attachment.url, response => {
      if (response.statusCode === 200) {
        response.pipe(file);
      } else {
        file.close();
        fs.unlinkSync(path);
        reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
      }
    });

    request.on('error', err => {
      file.close();
      fs.unlinkSync(path);
      reject(err);
    });

    file.on('finish', () => {
      const content = fs.readFileSync(path);
      fs.unlinkSync(path);
      resolve(content.toString());
    });

    file.on('error', err => {
      file.close();

      if (err.code === 'EEXIST') {
        reject(new Error('File already exists'));
      } else {
        fs.unlinkSync(path);
        reject(err);
      }
    });
  });
}
