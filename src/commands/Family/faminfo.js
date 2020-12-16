'use strict';

const { MessageEmbed } = require('discord.js');
const { getFamilyByMember } = require('../../handlers/family');
const Command = require('../../structures/Command');
const familyConfig = require('../../utils/config').familyConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'faminfo',
    });
  }
  // eslint-disable-next-line consistent-return
  async run({ args, message }) {
    message.delete();

    const settings = familyConfig[message.guild.id];
    if (!settings) return this.sendError(message, 'Настройки для этого сервера не найдены');

    const category = message.guild.channels.cache.get(settings.categoryID);
    if (!category) return this.sendError(message, `Категория семей не найдена`);

    let name = args.join(' ');
    let channel;
    if (!name) {
      channel = getFamilyByMember(message.member);
      if (!channel) return this.sendError(message, 'Вы не состоите в семье.\nИспользуйте: /faminfo [name]');
      name = channel.name;
    } else {
      channel = category.children.find(ch => ch.name === name);
      if (!channel) return this.sendError(message, `Семья не найдена`);
    }
    const role = message.guild.roles.cache.find(r => r.name === name);
    if (!role) return this.sendError(message, `Роль семьи не найдена`);

    const permissionOverwrites = channel.permissionOverwrites;
    const owner = permissionOverwrites.find(p => p.allow.has('DEAFEN_MEMBERS', false)).id;
    const deputies = permissionOverwrites.filter(
      p => p.allow.has('MUTE_MEMBERS', false) && !p.allow.has('DEAFEN_MEMBERS', false),
    );

    deputies.each(element => {
      deputies.set(element.id, message.guild.member(element.id).toString());
    }, deputies);

    await message.channel
      .send(
        new MessageEmbed()
          .setColor(0x0fda37)
          .setTitle(`Информация о семье \`${name}\``)
          .setDescription(
            `**Лидер семьи: <@!${owner}>**${
              deputies.size !== 0
                ? `\n**Заместител${deputies.size === 1 ? 'ь' : 'и'} семьи: ${deputies
                    .mapValues(element => element)
                    .array()
                    .join(', ')}**`
                : ''
            }\n**Всего членов семьи: \`${role.members.size}\`**`,
          ),
      )
      .catch(e => console.error(e));
  }

  sendError(message, content) {
    message.channel.send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content));
  }
};
