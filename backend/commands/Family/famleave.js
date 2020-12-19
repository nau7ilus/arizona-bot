'use strict';

const { MessageEmbed } = require('discord.js');
const { getFamilyByMember } = require('../../handlers/family');
const Command = require('../../structures/Command');
const familyConfig = require('../../utils/config').familyConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'famleave',
    });
  }
  // eslint-disable-next-line consistent-return
  async run({ message }) {
    message.delete();

    const settings = familyConfig[message.guild.id];
    if (!settings) return this.sendError('Настройки для этого сервера не найдены');

    const category = message.guild.channels.cache.get(settings.categoryID);
    if (!category) return this.sendError(message, `Категория семей не найдена`);

    const member = message.member;

    const channel = getFamilyByMember(member);
    if (!channel) return this.sendError(message, `Вы не состоите в семье`);

    const role = message.guild.roles.cache.find(r => r.name === channel.name);
    if (!role) return this.sendError(message, `Роль семьи не найдена`);

    if (
      channel.permissionOverwrites.some(perms => perms.id === member.id && perms.allow.has('DEAFEN_MEMBERS', false))
    ) {
      return this.sendError(message, `Лидер не может покинуть семью`);
    }

    // Если member заместитель, обнуляем права
    if (channel.permissionOverwrites.some(perms => perms.id === member.id && perms.allow.has('MUTE_MEMBERS', false))) {
      await channel.updateOverwrite(member.id, {
        VIEW_CHANNEL: null,
        CONNECT: null,
        MUTE_MEMBERS: null,
      });
    }

    await member.roles.remove(role);

    await message.channel
      .send(
        member,
        new MessageEmbed()
          .setColor(0x0fda37)
          .setTitle('Выход из семьи')
          .setDescription(`${member} покинул семью \`${channel.name}\``),
      )
      .then(msg => {
        msg.delete({ timeout: 5000 });
      });
  }

  sendError(message, content) {
    message.channel.send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content));
  }
};
