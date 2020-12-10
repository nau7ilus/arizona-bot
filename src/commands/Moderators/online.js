'use strict';

const { fractionNames } = require('@nieopierzony/core').helpers;
const { MessageEmbed } = require('discord.js');
const plural = require('plural-ru');

const { getOnline } = require('../../handlers/online');
const Command = require('../../structures/Command');
const allSettings = require('../../utils/config').onlineSettings;

const numbers = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const PEOPLE = key => plural(key, `%d человек`, `%d человека`, `%d человек`);
const colors = {
  // Полиция ЛС
  1: 0x7383e6,
  // Полиция РК
  2: 0x7383e6,
  // ФБР
  3: 0x7383e6,
  // Полиция СФ
  4: 0x7383e6,
  // Больница ЛС
  5: 0xff6db2,
  // Правительство
  6: 0xff6db2,
  // Тюрьма строгого режима
  7: 0xc0a987,
  // Больница СФ
  8: 0xff6db2,
  // Автошкола
  9: 0xffb074,
  // Радио ЛС
  10: 0xfe9746,
  // Grove Street
  11: 0x4f9452,
  // Vagos
  12: 0xd6cc70,
  // Ballas
  13: 0xbe4ed1,
  // Aztecas
  14: 0x79e2c8,
  // Rifa
  15: 0x5577be,
  // Русская мафия
  16: 0x4fa59e,
  // Якудза
  17: 0xbb2e40,
  // La Cosa Nostra
  18: 0xad4ea7,
  // Warlock MC
  19: 0xc76c3d,
  // Армия ЛС
  20: 0xb8865f,
  // Центральный банк
  21: 0x70ccbd,
  // Больница ЛВ
  22: 0xff6db2,
  // Полиция ЛВ
  23: 0x7383e6,
  // Радио ЛВ
  24: 0xfe9746,
  // Ночные волки
  25: 0xbc8f8f,
  // Радио СФ
  26: 0xfe9746,
  // Армия СФ
  27: 0xb8865f,
  // Страховая компания
  29: 0x67a1d3,
};
const titles = {
  1: '👮┃ Полиция ЛС',
  2: '👮┃ Полиция РК',
  3: '👮┃ ФБР',
  4: '👮┃ Полиция СФ',
  5: '🏥┃ Больница ЛС',
  6: '💼┃ Правительство',
  7: '💂┃ Тюрьма строго режима',
  8: '🏥┃ Больница СФ',
  9: '🚦┃ Автошкола',
  10: '📷┃ Радио ЛС',
  11: '🔫┃ Grove Street',
  12: '🔫┃ Vagos',
  13: '🔫┃ Ballas',
  14: '🔫┃ Aztecas',
  15: '🔫┃ Rifa',
  16: '🎱┃ Русская мафия',
  17: '㊙┃ Якузда',
  18: '🎩┃ La Cosa Nostra',
  19: '🎲┃ Warlock MC',
  20: '⭐┃ Армия ЛС',
  21: '💰┃ Центральный банк',
  22: '🏥┃ Больница ЛВ',
  23: '👮┃ Полиция ЛВ',
  24: '📷┃ Радио ЛВ',
  25: '🔫┃ Ночные волки',
  26: '📷┃ Радио СФ',
  27: '⭐┃ Армия СФ',
  29: '💰┃ Страховая компания',
};

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'online',
      devOnly: true,
      userPermissions: ['ADMINISTRATOR'],
    });
  }
  async run({ args, message }) {
    // Check settings for guild
    const settings = allSettings[message.guild.id];
    if (!settings) {
      return this.sendError(message, 'Настройки для этого сервера не установлены');
    }

    // Check if member is moderator
    const isModer =
      message.member.hasPermission('ADMINISTRATOR') ||
      message.member.roles.cache.some(r => settings.moderators.includes(r.id));

    // If user's moder and there's no specified fraction ID
    if (isModer && !args[0]) {
      return this.sendError(message, 'Вы должны указать ID фракции: `/online <id>`');
    }

    // Get fraction ID to find by member's roles
    const fractionIDs = isModer
      ? [args[0]]
      : Object.entries(settings.fractionsByRoles).filter(r =>
          message.member.roles.cache.some(i => r[1].includes(i.id)),
        );

    // If user has not any fraction to show online
    if (!isModer && !fractionIDs.length) {
      return this.sendError(message, 'У вас нет доступа к просмотру онлайна фракций');
    }

    if (!isModer && fractionIDs.length > 1) {
      return this.awaitFractions(message, fractionIDs);
    }

    return this.showOnline(
      message,
      message.member,
      fractionIDs.map(f => +f[0]),
    );
  }

  async showOnline(message, mentionMember, fractionIDs, edit = false) {
    const settings = allSettings[message.guild.id];

    if (!settings) return;

    const embeds = [];
    for await (const fractionID of fractionIDs) {
      const players = await getOnline(message.client, {
        fractionID: fractionID,
        serverID: settings.gameServerID,
      });

      // TODO: Игнорировать админов в списке замов
      const seniors = players.filter(p => p.rank >= 9);
      const membersOnline = players.filter(p => p.online).length;

      embeds.push(
        new MessageEmbed()
          .setTitle(`**${titles[fractionID]}**`)
          .setColor(colors[fractionID])
          .setDescription(
            `**\`\`\`Всего людей во фракции: ${PEOPLE(players.length)}\nОнлайн на данный момент: ${PEOPLE(
              membersOnline,
            )}\nИз которых руководство: ${PEOPLE(
              seniors.filter(i => i.online).length,
            )}\`\`\`\nРуководство:\`\`\`diff\n${seniors
              .sort((a, b) => b.rank - a.rank)
              .map(
                m =>
                  `${m.online ? '+' : '-'} ${m.nickname} - ${m.rank === 10 ? 'Лидер' : 'Заместитель'} - ${
                    m.online ? 'В игре' : 'Оффлайн'
                  }`,
              )
              .join('\n')}\`\`\`**`,
          ),
      );
    }

    message.channel.send(mentionMember, ...embeds);
  }

  async awaitFractions(message, fractionIDs) {
    const fractions = this._fractionsToArray(fractionIDs);
    const msg = await message.channel.send(message.member, this._createChooseMenu(this._formatFractionIDs(fractions)));
    console.log(this._formatFractionIDs(fractions));
    for (const [i] of fractions.slice(0, 11).entries()) {
      msg.react(numbers[i]);
    }
    msg.react('🆗');

    const filter = reaction => reaction.emoji.name === '🆗' || numbers.includes(reaction.emoji.name);
    const collector = msg.createReactionCollector(filter, { time: 60000 });

    collector.on('collect', (reaction, user) => {
      if (user.bot) return;
      if (user.id !== message.author.id) {
        // eslint-disable-next-line consistent-return
        return reaction.users.remove(user);
      }

      if (numbers.includes(reaction.emoji.name)) {
        reaction.users.remove(user);

        const elementIndex = numbers.indexOf(reaction.emoji.name);
        if (elementIndex === 0) {
          if (fractions[0].isSelected) {
            fractions.forEach(r => (r.isSelected = false));
          } else {
            fractions.forEach(r => (r.isSelected = true));
          }
        } else {
          fractions[elementIndex].isSelected = !fractions[elementIndex].isSelected;

          if (fractions.slice(1, 10).every(r => r.isSelected)) {
            fractions[0].isSelected = true;
          } else {
            fractions[0].isSelected = false;
          }
        }

        msg.edit(message.member, this._createChooseMenu(this._formatFractionIDs(fractions)));
      } else if (reaction.emoji.name === '🆗') {
        if (!fractions.find(r => r.isSelected)) {
          msg.edit(
            this._createChooseMenu(
              this._formatFractionIDs(fractions),
              'Вы не выбрали ни одной фракции для отображения',
            ),
          );
          // eslint-disable-next-line consistent-return
          return reaction.users.remove(user);
        }
        msg.reactions.removeAll();
        msg.edit(message.member, new MessageEmbed().setColor(0x2f3136).setTitle('**Загрузка...**'));
        this.showOnline(
          msg,
          message.member,
          fractions.filter(f => f.isSelected && f.id !== 0).map(f => +f.id),
          true,
        );
      } else {
        reaction.users.remove(user);
      }
    });
  }

  _fractionsToArray(fractionIDs) {
    const arr = [{ id: 0, isSelected: false }];
    fractionIDs.forEach(f => {
      arr.push({ id: f[0], isSelected: false });
    });
    return arr;
  }

  _formatFractionIDs(fractions) {
    return `\`\`\`diff\n${fractions
      .map(
        (j, i) => `${j.isSelected ? '+ ' : ''}[${i}] ${j.id === 0 ? 'Выбрать все фракции\n' : fractionNames[j.id - 1]}`,
      )
      .join('\n')}\`\`\``;
  }

  _createChooseMenu(content, error) {
    return new MessageEmbed()
      .setColor(0x03c2fc)
      .setTitle('**🔎 ┃ Выбор фракции для просмотра**')
      .setFooter('На выбор у вас есть 1 минута')
      .setTimestamp()
      .setDescription(`**${content}${error ? `\n\`\`\`diff\n- ${error}\`\`\`` : ''}**`);
  }

  sendError(message, content) {
    message.react('❌');
    message.channel
      .send(message.member, new MessageEmbed().setColor(0xff4a4a).setTitle(content))
      .then(msg => msg.delete({ timeout: 15000 }));
  }
};
