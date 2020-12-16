'use strict';

const { MessageEmbed } = require('discord.js');
const { getFamilyByLeader, getFamilyByMember } = require('../../handlers/family');
const Command = require('../../structures/Command');
const familyConfig = require('../../utils/config').familyConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'faminvite',
    });
  }
  // eslint-disable-next-line consistent-return
  async run({ args, message }) {
    message.delete();

    const settings = familyConfig[message.guild.id];
    if (!settings) return this.sendError(message, 'Настройки для этого сервера не найдены');

    const category = message.guild.channels.cache.get(settings.categoryID);
    if (!category) return this.sendError(message, `Категория семей не найдена`);

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!member) return this.sendError(message, `Используйте: \`/faminvite [member/id]\``);

    const channel = getFamilyByLeader(message.member);
    if (!channel) return this.sendError(message, `У вас нет прав!`);

    if (member.bot) return this.sendError(message, `Вы не можете пригласить этого пользователя`);

    const role = message.guild.roles.cache.find(r => r.name === channel.name);
    if (!role) return this.sendError(message, `Роль семьи не найдена`);

    if (getFamilyByMember(member)) return this.sendError(message, `Этот пользователь уже состоит в семье`);

    await message.channel
      .send(
        member,
        new MessageEmbed()
          .setColor(0x0fda37)
          .setTitle('Приглашение в семью')
          .setDescription(`${message.author} пригласил Вас в семью \`${channel.name}\``)
          .setFooter(`Нажмите на галочку, чтобы принять приглашение!`),
      )
      .then(msg => {
        msg.react('✅');
        msg.delete({ timeout: 15000 });
      });
  }

  sendError(message, content) {
    message.channel.send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content));
  }
};
