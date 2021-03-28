'use strict';

const { MessageEmbed } = require('discord.js');
const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const rrselfConfig = require('../../utils/config').rrselfConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'rrself',
    });
  }
  async run({ args, message }) {
    
    message.delete()
    const rolesToRemove = config.roles.filter(r => message.member.roles.cache.has(r));
    const unsuccessRoles = [];
    const settings = rrselfConfig[message.guild.id]

    rolesToRemove.forEach(r => {if (roles.length === 0) {
      sendErrorMessage({
        message,
        content: 'Роли для снятия не найдены',
        member: message.member,
        react: false
      })
      return
    }

    message.member.roles.remove(r).catch(err => {
// handle err
unsuccessRoles.push({ id: r, reason: err.message });
});
});

    const embed = new MessageEmbed()
        .setColor('#2ECC71')
        .setTitile('** :white_check_mark: | Успешное выполнение команды!**')
        .setDescription(`Вы успешно сняли с себя роли: ${roles.join()}`);
    const msg = await message.channel.send(embed)
}
};