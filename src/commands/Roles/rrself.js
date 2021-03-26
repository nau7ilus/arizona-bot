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

    const settings = rrselfConfig[message.guild.id]

    const roles = message.member.roles.cache.map(r => {
      if (settings.roles.includes(r.id)) {
        message.member.roles.remove(r.id)

        return r
      }
    }).filter(r => r !== undefined)

    if (roles.length === 0) {
      sendErrorMessage({
        message,
        content: 'Роли для снятия не найдены',
        member: message.member,
        react: false
      })
      return
    }

    const embed = new MessageEmbed()
        .setColor('random')
        .setDescription(`Вы успешно сняли с себя роли: ${roles.join()}`)
    const msg = await message.send(embed)

    msg.delete({ timeout: 5 * 6000 })
  }
}
