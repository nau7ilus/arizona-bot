/* eslint-disable no-irregular-whitespace */
/* eslint-disable max-len */
/* eslint-disable consistent-return */
'use strict';

const { MessageEmbed } = require('discord.js');
const { sendErrorMessage } = require('../utils');

const oneArgFuncs = {
  color: (embed, color) => {
    embed.setColor(color);
  },
  title: (embed, title) => {
    embed.setTitle(title);
  },
  description: (embed, description) => {
    embed.setDescription(description);
  },
  image: (embed, url) => {
    embed.setImage(url);
  },
  thumbnail: (embed, url) => {
    embed.setThumbnail(url);
  },
  url: (embed, url) => {
    embed.setURL(url);
  },
};

let embed = new MessageEmbed();

exports.action = async (message, member, action, args) => {
  if (action === 'help') {
    const helpEmbed = new MessageEmbed()
      .setColor('GREEN')
      .setTitle("Помощь по системе embed'ов")
      .setDescription(
        `**\`/embed [действие] (аргумент #0) (аргумент #1) (аргумент #2)\`

\`/embed help\` - отобразить это сообщение
\`/embed reset\` - сбросить embed
\`/embed preview\` - предпросмотр соообщения, с отображением названий пунктов
\`/embed send\` - отправить сообщение содержащие embed
\`/embed read [message url]\` - считать embed из сообщения по ссылке
\`/embed set\`
        \`color [color resolvable]\` - установить [цвет](https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable)
        \`title [title]\` - установить заголовок (без форматирования)
        \`description [description]\` - установить описание (с [форматированием](https://discord.fandom.com/ru/wiki/Форматирование_текста))
        \`image/thumbnail [image url]\` - установить изображение/миниатюру
        \`url [url]\` - установить ссылку

        \`footer\`
                \`text [text]\` - установить текст нижнего колонтитула
                \`icon [image url]\` - установить изображение нижнего клонтитула

        \`author\`
                \`name [name]\` - установить имя автора
                \`icon [image url]\` - установить изображение автора
                \`url [url]\` - установить ссылку автора
\`/embed add\`
        \`timestamp\` - добавить timestamp с текущим временем
        \`field\` - добавить поле в embed (интерактивная команда)
\`/embed remove [point]\` - удалить пункт, см. /embed preview
\`/embed remove field [id]\` - удалить поле под номером id, см. /embed preview 
    **`,
      )
      .setTimestamp();
    message.channel.send(helpEmbed);
    return;
  }

  if (action === 'reset') {
    embed = new MessageEmbed();
    return;
  }

  if (action === 'preview') {
    const toSend = new MessageEmbed(embed);
    if (toSend.author) toSend.author.name = `[author] ${toSend.author.name}`;
    if (toSend.footer) toSend.footer.text = `[footer] ${toSend.footer.text}`;
    toSend.title = toSend.title ? `[title] ${toSend.title}` : toSend.title;
    toSend.description = toSend.description ? `[description] ${toSend.description}` : toSend.description;
    for (let i in toSend.fields) {
      toSend.fields[i].name = `[${i}] [field name] ${toSend.fields[i].name}`;
      toSend.fields[i].value = `[${i}] [field value] ${toSend.fields[i].value}`;
    }
    message.channel.send(toSend);
    return;
  }

  if (action === 'send') {
    message.channel.send(embed);
    return;
  }

  if (action === 'read') {
    const url = args[0];
    const ids = [...url.matchAll(/\d+/gm)];

    if (message.guild.id !== ids[0][0]) {
      sendErrorMessage({
        message: message,
        content: 'Некорректный Discord сервер',
        member: member,
        react: false,
      });
      return;
    }

    const channel = message.guild.channels.cache.get(ids[1][0]);
    if (!channel || !channel.isText || !channel.viewable) {
      sendErrorMessage({
        message: message,
        content: 'Некорректный канал сообщения',
        member: member,
        react: false,
      });
      return;
    }

    const msg = await channel.messages.fetch(ids[2][0]);
    if (!msg || !msg.embeds || !msg.embeds[0]) {
      sendErrorMessage({
        message: message,
        content: 'Некорректное сообщение',
        member: member,
        react: false,
      });
      return;
    }

    embed = msg.embeds[0];
  }

  if (action === 'set') {
    if (Object.keys(oneArgFuncs).includes(args[0])) {
      if (!args[1] || args[1] === '') {
        sendErrorMessage({
          message: message,
          content: 'Укажите корректный аргумент #1',
          member: member,
          react: false,
        });
        return;
      }

      oneArgFuncs[args[0]](embed, args.slice(1).join(' '));
      return;
    }

    if (args[0] === 'footer') {
      if (!args[2] || args[2] === '') {
        sendErrorMessage({
          message: message,
          content: 'Укажите корректный аргумент #2',
          member: member,
          react: false,
        });
        return;
      }

      if (args[1] === 'text') {
        embed.setFooter(args.slice(2).join(' '), embed.footer ? embed.footer.iconURL : undefined);
        return;
      }

      if (args[1] === 'icon') {
        embed.setFooter(embed.footer ? embed.footer.text : '', args.slice(2).join(' '));
        return;
      }

      sendErrorMessage({
        message: message,
        content: 'Укажите корректный аргумент #1',
        member: member,
        react: false,
      });
      return;
    }

    if (args[0] === 'author') {
      if (!args[2] || args[2] === '') {
        sendErrorMessage({
          message: message,
          content: 'Укажите корректный аргумент #2',
          member: member,
          react: false,
        });
        return;
      }

      if (args[1] === 'name') {
        embed.setAuthor(
          args.slice(2).join(' '),
          embed.author ? embed.author.iconURL : undefined,
          embed.author ? embed.author.url : undefined,
        );
        return;
      }

      if (args[1] === 'icon') {
        embed.setAuthor(
          embed.author ? embed.author.name : undefined,
          args.slice(2).join(' '),
          embed.author ? embed.author.url : undefined,
        );
        return;
      }

      if (args[1] === 'url') {
        embed.setAuthor(
          embed.author ? embed.author.name : undefined,
          embed.author ? embed.author.iconURL : undefined,
          args.slice(2).join(' '),
        );
        return;
      }

      sendErrorMessage({
        message: message,
        content: 'Укажите корректный аргумент #1',
        member: member,
        react: false,
      });
      return;
    }

    sendErrorMessage({
      message: message,
      content: 'Укажите корректный аргумент #0',
      member: member,
      react: false,
    });
    return;
  }

  if (action === 'add') {
    if (args[0] === 'timestamp') {
      embed.setTimestamp();
      return;
    }

    if (args[0] === 'field') {
      (await message.channel.send(`**Отправьте заголовок поля\nДля отмены введите \`-\`**`)).delete({ timeout: 60000 });

      const name = await message.channel
        .awaitMessages(m => m.author.id === message.author.id, {
          max: 1,
          time: 60 * 1000,
          errors: ['time'],
        })
        .catch(() => {
          message.channel.send(`**Время на ввод истекло.**`);
        });

      name.first().delete();

      if (!name || name.first().content === '-') {
        message.reply('**отменено**');
        return;
      }

      (await message.channel.send(`**Отправьте текст нового поля\nДля отмены введите \`-\`**`)).delete({
        timeout: 60000,
      });

      const value = await message.channel
        .awaitMessages(m => m.author.id === message.author.id, {
          max: 1,
          time: 60 * 1000,
          errors: ['time'],
        })
        .catch(() => {
          message.channel.send(`**Время на ввод истекло.**`);
        });

      value.first().delete();

      if (!value || value.first().content === '-') {
        message.reply('**отменено**');
        return;
      }

      (
        await message.channel.send(
          `**Отправьте \`1\`, если поле должно быть в линию
Отправьте \`любой другой текст\`, если поле не должно быть в линию
Для отмены введите \`-\`**`,
        )
      ).delete({ timeout: 60000 });

      const inline = await message.channel
        .awaitMessages(m => m.author.id === message.author.id, {
          max: 1,
          time: 60 * 1000,
          errors: ['time'],
        })
        .catch(() => {
          message.channel.send(`**Время на ввод истекло.**`);
        });

      inline.first().delete();

      if (!inline || inline.first().content === '-') {
        message.reply('**отменено**');
        return;
      }

      embed.addField(name.first().content, value.first().content, inline.first().content === '1');
      message.reply('**поле добавлено!**');
      return;
    }

    sendErrorMessage({
      message: message,
      content: 'Укажите корректный аргумент #0',
      member: member,
      react: false,
    });
    return;
  }

  if (action === 'remove') {
    if (
      ['author', 'color', 'description', 'footer', 'image', 'thumbnail', 'timestamp', 'title', 'url'].includes(args[0])
    ) {
      embed[args[0]] = undefined;
      return;
    }

    if (args[0] === 'field') {
      if (!args[1] || args[1] === '' || isNaN(parseInt(args[1])) || !embed.fields || !embed.fields[parseInt(args[1])]) {
        sendErrorMessage({
          message: message,
          content: 'Укажите корректный аргумент #1',
          member: member,
          react: false,
        });
        return;
      }

      embed.spliceFields(parseInt(args[1]), 1);
      return;
    }

    sendErrorMessage({
      message: message,
      content: 'Укажите корректный аргумент #0',
      member: member,
      react: false,
    });
  }
};
