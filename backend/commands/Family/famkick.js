'use strict';

const { MessageEmbed } = require('discord.js');
const { getFamilyByLeader } = require('../../handlers/family');
const Command = require('../../structures/Command');
const familyConfig = require('../../utils/config').familyConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'famkick',
    });
  }
  // eslint-disable-next-line consistent-return
  async run({ args, message }) {
    message.delete();

    const settings = familyConfig[message.guild.id];
    if (!settings) return this.sendError('Настройки для этого сервера не найдены');

    const category = message.guild.channels.cache.get(settings.categoryID);
    if (!category) return this.sendError(message, `Категория семей не найдена`);

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return this.sendError(message, `Используйте: \`/famkick [member/id]\``);

    const channel = getFamilyByLeader(message.member);
    if (!channel) return this.sendError(message, `У вас нет прав!`);

    const role = message.guild.roles.cache.find(r => r.name === channel.name);
    if (!role) return this.sendError(message, `Роль семьи не найдена`);

    if (!member.roles.cache.has(role.id)) return this.sendError(message, `Этот пользователь не состоит в вашей семье`);

    if (
      channel.permissionOverwrites.some(perms => perms.id === member.id && perms.allow.has('DEAFEN_MEMBERS', false))
    ) {
      return this.sendError(message, `Вы не можете исключить лидера семьи`);
    }

    if (channel.permissionOverwrites.some(perms => perms.id === member.id && perms.allow.has('MUTE_MEMBERS', false))) {
      if (
        channel.permissionOverwrites.some(
          perms => perms.id === message.author.id && perms.allow.has('DEAFEN_MEMBERS', false),
        )
      ) {
        await channel.updateOverwrite(member.id, {
          VIEW_CHANNEL: null,
          CONNECT: null,
          MUTE_MEMBERS: null,
        });
      } else {
        return this.sendError(message, `Вы не можете исключить заместителя семьи`);
      }
    }

    await member.roles.remove(role);

    await message.channel
      .send(
        member,
        new MessageEmbed()
          .setColor(0x0fda37)
          .setTitle('Исключение из семьи')
          .setDescription(`${message.author} исключил Вас из семьи \`${channel.name}\``),
      )
      .then(msg => {
        msg.delete({ timeout: 15000 });
      });
  }

  sendError(message, content) {
    message.channel.send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content));
  }
};
