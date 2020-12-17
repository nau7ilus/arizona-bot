'use strict';

const { MessageEmbed } = require('discord.js');
const Command = require('../../structures/Command');
const familyConfig = require('../../utils/config').familyConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'famdel',
      devOnly: true,
    });
  }
  // eslint-disable-next-line consistent-return
  async run({ args, message }) {
    message.delete();

    const settings = familyConfig[message.guild.id];
    if (!settings) return this.sendError(message, 'Настройки для этого сервера не найдены');

    const category = message.guild.channels.cache.get(settings.categoryID);
    if (!category) return this.sendError(message, `Категория семей не найдена`);

    const name = args.join(' ');
    if (!name) return this.sendError(message, `Используйте: /famdel [name]`);
    const channel = category.children.find(ch => ch.name === name);
    if (!channel) return this.sendError(message, `Канал семьи не найден`);
    const role = message.guild.roles.cache.find(r => r.name === name);
    if (!role) return this.sendError(message, `Роль семьи не найдена`);

    await channel.delete();
    await role.delete();

    message.channel
      .send(
        new MessageEmbed()
          .setColor(0x0fda37)
          .setTitle('Семья успешно удалена')
          .setDescription(`Семья \`${name}\` удалена`),
      )
      .then(msg => msg.delete({ timeout: 5000 }));
  }

  sendError(message, content) {
    message.channel.send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content));
  }
};
