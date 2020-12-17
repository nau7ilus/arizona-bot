'use strict';

const { MessageEmbed } = require('discord.js');
const { getFamilyByMember, getFamilyByLeader, getFamilyByOwner } = require('../../handlers/family');
const Command = require('../../structures/Command');
const familyConfig = require('../../utils/config').familyConfig;

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'famhelp',
    });
  }
  // eslint-disable-next-line consistent-return
  async run({ message }) {
    message.delete();

    const settings = familyConfig[message.guild.id];
    if (!settings) return this.sendError(message, 'Настройки для этого сервера не найдены');

    const fields = [
      {
        name: 'Пользователь',
        value: `**\`/famhelp\` - отобразить это сообщение
                \`/faminfo [name]\` - отобразить информацию о семье \`name\`**`,
      },
    ];

    if (getFamilyByMember(message.member)) {
      fields.push({
        name: 'Член семьи',
        value: `**\`/famleave\` - покинуть семью
                      \`/faminfo\` - отобразить информацию о своей семье**`,
      });
    }

    if (getFamilyByLeader(message.member)) {
      fields.push({
        name: 'Заместитель семьи',
        value: `**\`/faminvite [member]\` - пригласить участника \`member\` в семью
                        \`/famkick [member]\` - исключить участнника \`member\` из семьи**`,
      });
    }

    if (getFamilyByOwner(message.member)) {
      fields.push({
        name: 'Лидер семьи',
        value: `**\`/famaddzam [member]\` - назначить \`member\` заместителем своей семьи
                        \`/famdelzam [member]\` - удалить \`member\` заместителя своей семьи**`,
      });
    }

    // eslint-disable-next-line newline-per-chained-call
    const embed = new MessageEmbed().setColor(0x0fda37).setTitle(`Помощь по семьям`).addFields(fields);

    await message.channel
      .send(embed)
      .then(msg => msg.delete({ timeout: 15000 }))
      .catch(e => console.error(e));
  }

  sendError(message, content) {
    message.channel.send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content));
  }
};
