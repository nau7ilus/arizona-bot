'use strict';

const { MessageEmbed } = require('discord.js');
const Command = require('../../structures/Command');
const familyConfig = require('../../utils/config').familyConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'famcreate',
      devOnly: true,
    });
  }
  // eslint-disable-next-line require-await
  // eslint-disable-next-line consistent-return
  async run({ args, message }) {
    message.delete();

    const settings = familyConfig[message.guild.id];
    if (!settings) return this.sendError(message, 'Настройки для этого сервера не найдены');

    const category = message.guild.channels.cache.get(settings.categoryID);
    if (!category) return this.sendError(message, `Категория семей не найдена`);

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    const name = args.slice(1).join(' ');

    if (!member || !name) return this.sendError(message, 'Используйте /famcreate [member/id] [name]');

    if (member.bot) return this.sendError(message, `Вы не можете сделать этого пользователя лидером семьи`);

    const baseRole = message.guild.roles.cache.get(settings.baseRoleID);
    const role = await message.guild.roles.create({
      data: {
        name: name,
        position: baseRole.position,
      },
    });

    member.roles.add(role);

    message.guild.channels.create(name, {
      type: 'voice',
      parent: category,
      permissionOverwrites: [
        {
          id: message.guild.id,
          deny: ['VIEW_CHANNEL', 'CONNECT'],
        },
        {
          id: role.id,
          allow: ['VIEW_CHANNEL', 'CONNECT'],
        },
        {
          id: member.id,
          allow: ['VIEW_CHANNEL', 'CONNECT', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS'],
        },
      ],
    });
  }

  sendError(message, content) {
    message.channel.send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content));
  }
};
