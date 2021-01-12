'use strict';

const fs = require('fs');
const { MessageAttachment } = require('discord.js');
const Command = require('../../structures/Command');
const newsCongig = require('../../utils/config').newsConfig;
const { sendErrorMessage } = require('../../utils/index');

module.exports = class extends Command {
  constructor(...args) {
    super(...args, {
      name: 'getinfo',
    });
  }
  // eslint-disable-next-line require-await
  async run({ args, message }) {
    message.delete();

    const settings = newsCongig[message.guild.id];
    if (!settings) return;

    if (
      !message.member.hasPermission('ADMINISTRATOR') &&
      !message.member.roles.cache.some(r => settings.allowedRoles.includes(r.id))
    ) {
      sendErrorMessage({
        message: message,
        content: 'У вас нет прав',
        member: message.member,
        react: false,
      });
      return;
    }

    let start, end;

    if (!args[0] || args[0] === '') {
      start = new Date(Date.now() - (new Date().getDay() - 1) * 24 * 60 * 60 * 1000);
      end = new Date();
    } else {
      const arr = args[0].split('-');
      if (arr.length !== 2) {
        sendErrorMessage({
          message: message,
          content: 'Используйте /getinfo [date]-[date] (example: /date 11.01.2021-12.01.2021)',
          member: message.member,
          react: false,
        });
        return;
      }
      start = new Date(toUTCdate(arr[0]));
      end = new Date(toUTCdate(arr[1]));
      if (!start || !end) {
        sendErrorMessage({
          message: message,
          content: 'Неверный формат даты',
          member: message.member,
          react: false,
        });
        return;
      }
    }

    if (end.getTime() < start.getTime()) {
      sendErrorMessage({
        message: message,
        content: 'Конечная дата не может быть раньше начальной',
        member: message.member,
        react: false,
      });
      return;
    }

    if (new Date().getTime() < end.getTime() && new Date().getDay() !== end.getDay()) {
      sendErrorMessage({
        message: message,
        content: 'Конечная дата не может быть позже настоящей',
        member: message.member,
        react: false,
      });
      return;
    }

    const msg = await message.reply('**пожалуйста, ожидайте.**');

    const gosInfo = await getLeadersInfo(start, end, message.guild.channels.cache.get(settings.gosChannel));
    const nelegalInfo = await getLeadersInfo(
      start,
      end,
      message.guild.channels.cache.get(settings.nelegalChannel),
      true,
    );
    const adminsUpInfo = await getAdminsUpInfo(
      start,
      end,
      message,
      message.guild.channels.cache.get(settings.adminsUpChannel),
    );
    const adminsHireInfo = await getAdminsHireInfo(start, end, message.guild, settings.adminRoles);

    fs.writeFileSync(
      'info.txt',
      `
[!!] Перед началом работы прочитать [!!]
Данный файл содержит конфиденциальную информацию относящуюся к ${message.guild.name}.
Если этот файл попал к вам по ошибке, закройте и удалите его.
Уполномоченным на получение этого файла, следует относиться к нему с осторожностью.
Информация в файле предоставляется "как есть" и она может быть неполной и/или неверной.
Информация содержащаяся в этом файле, основана на административных данных Discord-сервера ${message.guild.name}
Обо всех ошибках сообщайте администрации бота.
[!!] Удачного пользования [!!]



[#] Информация о государственных органнизациях
${gosInfo.join('\n')}


[#] Информация о нелегальных организациях
${nelegalInfo.join('\n')}


[#] Информация о постановлении/повышении администрации
${adminsUpInfo.join('\n')}


[#] Информация о снятии администрации
[!] В силу специфики системы, информация в данном разделе, содержит discord никнеймы и ID discord аккаунтов.
[!] Учитывайте это при работе с информацией 
${adminsHireInfo.join('\n')}
`,
    );

    const attachment = new MessageAttachment(
      'info.txt',
      `Information for ${dateToString(start)}-${dateToString(end)}.txt`,
    );

    msg.delete();

    try {
      await message.author.send(attachment);
      await message.reply('**проверьте личные сообщения.**');
    } catch (e) {
      if (e.message === 'Cannot send messages to this user') {
        (
          await message.channel.send(
            `${message.author}, **невозможно отправить личное сообщение.\nУ вас есть 30 секунд, чтобы скачать файл**`,
            attachment,
          )
        ).delete({ timeout: 30 * 1000 });
      }
    }

    fs.unlinkSync('info.txt');
  }
};

function getAdminsUpInfo(start, end, message, channel) {
  return new Promise(resolve => {
    channel.messages
      .fetch({
        limit: 100,
      })
      .then(messages => {
        const result = [];
        const map = new Map();
        messages.forEach(element => {
          const a = [
            ...element.content.matchAll(
              // eslint-disable-next-line max-len
              /1\..*?([a-zA-Z]+(?: |_)[a-zA-Z]+)\n2\..*?(\d+)\n3\..*?(\d{1,2}\.\d{1,2}.\d{2,4})/gm,
            ),
          ];
          if (a.length === 0) return;
          const [, nick, lvl, date] = a[0];
          const [day, monthZ, year] = date.split('.');
          const month = +monthZ - 1;
          const obj = {
            date: new Date(+year, +month, +day),
            nick,
            lvl,
          };
          if (map.has(message.author.id)) {
            map.get(message.author.id).push(obj);
            map.get(message.author.id).sort((foo, b) => b.date.getTime() - foo.date.getTime());
          } else {
            map.set(message.author.id, [obj]);
          }
        });
        map.forEach(value => {
          if (isInTime(value[0].date, start, end)) {
            const status =
              value.length === 1 ? 'Поставлен' : value[0].lvl - value[1].lvl === 1 ? 'Повышен' : 'Восстановлен';
            result.push(`${dateToString(value[0].date)} | ${status} ${value[0].nick} на LVL ${value[0].lvl}`);
          }
        });
        resolve(result);
      });
  });
}

function getAdminsHireInfo(start, end, guild, adminRoles) {
  return new Promise(resolve => {
    guild
      .fetchAuditLogs({
        type: 25,
      })
      .then(audit => {
        const entries = audit.entries.filter(
          entry => isInTime(entry.createdAt, start, end) && isHiredFrom(entry, guild, adminRoles),
        );
        const map = new Map();
        entries.forEach(entry => {
          const obj = {
            date: entry.createdAt,
            lvl: entry.changes.find(e => e.key === '$remove').new.find(r => adminRoles.includes(r.id)).name,
            discordID: entry.target.id,
            discordDisplayName: guild.member(entry.target)
              ? guild.member(entry.target).displayName
              : entry.target.username,
          };
          if (map.has(entry.target.id)) {
            map.get(entry.target.id).push(obj);
            map.get(entry.target.id).sort((a, b) => b.date.getTime() - a.date.getTime());
          } else {
            map.set(entry.target.id, [obj]);
          }
        });
        const result = [];
        map.forEach(value => {
          result.push(
            `${dateToString(value[0].date)} | Снят ${value[0].discordDisplayName} (id : ${value[0].discordID}) с ${
              value[0].lvl
            }`,
          );
        });
        resolve(result);
      });
  });
}

function getLeadersInfo(start, end, channel, isNelegal = false) {
  return new Promise(resolve => {
    channel.messages.fetch().then(messages => {
      const result = [];

      messages.forEach(element => {
        const [date, content] = isNelegal
          ? [
              element.content.split(/\] \|?/)[0],
              element.content
                .split(/\] \|?/)
                .slice(1)
                .join('] '),
            ]
          : element.content.split(' | ');
        const [day, monthZ, year] = isNelegal ? date.slice(1).split('.') : date.split('.');
        const month = +monthZ - 1;
        if (
          isInTime(new Date(year, month, day), start, end) &&
          (content.toLowerCase().startsWith('поставлен') || content.toLowerCase().startsWith('снят'))
        ) {
          result.push(`${dateToString(new Date(year, month, day))} | ${content}`);
        }
      });
      resolve(result);
    });
  });
}

function dateToString(date) {
  const day = date.getDate();
  const month = +date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day >= 10 ? '' : '0'}${day}.${month >= 10 ? '' : '0'}${month}.${year}`;
}

function isInTime(date, start, end) {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  return (
    (+day === start.getDate() && +month === start.getMonth() && +year === start.getFullYear()) ||
    (+day === end.getDate() && +month === end.getMonth() && +year === end.getFullYear()) ||
    (start.getTime() < new Date(+year, +month, +day).getTime() &&
      new Date(+year, +month, +day).getTime() < end.getTime())
  );
}

function isHiredFrom(entry, guild, roles) {
  return (
    !entry.executor.bot &&
    entry.changes.some(change => change.key === '$remove' && change.new.some(r => roles.includes(r.id))) &&
    entry.target &&
    (!guild.member(entry.target) || !guild.member(entry.target).roles.cache.some(r => roles.includes(r.id)))
  );
}

function toUTCdate(str) {
  const s = str.split('.');
  return new Date(`${s[1]}.${s[0]}.${s[2]}`);
}
