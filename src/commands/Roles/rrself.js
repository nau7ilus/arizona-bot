'use strict';

const { MessageEmbed } = require('discord.js');
const plural = require('plural-ru');

const Command = require('../../structures/Command');
const { sendErrorMessage } = require('../../utils');
const { rrselfConfig } = require('../../utils/config');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'rrself',
    });
  }
  async run({ message }) {
    const msg = message;
    if (talkedRecently.has(msg.author.id)) {
      return message.channel.send(
        new MessageEmbed()
          .setColor('#E74C3C')
          .setTitle(' no_entry | Ошибка при исполнении команды ')
          .setDescription(' В данный момент вы не можете использовать эту команду:')
          .addField('Пользователь:', message.member),
      );
    }

talkedRecently.add(msg.author.id);

  setTimeout(() => {

    talkedRecently.delete(msg.author.id);

  }, 1440000 * 24);
  // после кода с кд проверка на наличие ролей из конфига
    const config = rrselfConfig[message.guild.id];
    if (!config) return;
  
    const roleIDsToRemove = config.roles.filter(r => message.member.roles.cache.has(r));
    const successRoles = [];
    const unsuccessRoles = [];

    if (roleIDsToRemove.length === 0) {
      sendErrorMessage({
        message,
        content: 'У вас нет ролей для снятия',
        member: message.member,
        react: false,
      });
      return;
    }

    for await (const id of roleIDsToRemove) {
      try {
        await message.member.roles.remove(id);
        successRoles.push(id);
      } catch (err) {
        unsuccessRoles.push({ id, reason: err.message });
      }
    }

    if (unsuccessRoles.length > 0) {
      sendErrorMessage({
        message,
        content: `Успешно снято ${plural(
          successRoles.length,
          '%d роль',
          '%d роли',
          '%d ролей',
        )}, произошла ошибка при снятии ${plural(unsuccessRoles.length, '%d роли', '%d ролей')}: ${unsuccessRoles
          .map(({ id, reason }) => `<@&${id}> - \`${reason}\``)
          .join('\n')}`,
        member: message.member,
        react: false,
      });
      return;
    }

    await message.channel.send(
      new MessageEmbed()
        .setColor('#2ECC71')
        .setTitle('** :white_check_mark: | Успешное выполнение команды!**')
        .setDescription(
          `**Вы успешно сняли с себя ${plural(
            successRoles.length,
            '%d роль',
            '%d роли',
            '%d ролей',
          )}: ${successRoles.map(id => `<@&${id}>`).join(', ')}**`,
        ),
    );
  }
};
