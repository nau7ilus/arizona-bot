'use strict';

const { MessageEmbed } = require('discord.js');
const AliasPiece = require('./Base/AliasPiece');
const { colors } = require('../utils/constants');

const types = {
  string: /.*/g,
  spaceString: /.*/g,
  number: /\d+/g,
  float: /\d+(?:.|,)\d+/g,
  // eslint-disable-next-line max-len
  date: /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[13-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/g,
  time: /\d+(?:d|h|m|s)/g,
  timestamp: /^(?:2[0-3]|1\d|0?\d|):(?:[0-5]?\d)(?::(?:[0-5]?\d))?$/g,
  user: /(?:(\d{18}))|(?:<@!?(\d{18})>)/g,
  channel: /(?:(\d{18}))|(?:<#?(\d{18})>)/g,
  role: /(?:(\d{18}))|(?:<@&(\d{18})>)/g,
};

const typesDescription = {
  string: 'Текст (без пробелов)',
  spaceString: 'Текст (с пробелами)',
  number: 'Целое число',
  float: 'Дробное число',
  date: `Дата (${new Date().getFullYear()}/${new Date().getMonth()}/${new Date().getDay()})`,
  time: 'Длительность (10d, 5m, 2h, 30s)',
  timestamp: 'Время (12:00, 9:30:20)',
  user: 'Пользователь (упоминание или id)',
  channel: 'Канал (упоминание или id)',
  role: 'Роль (упоминание или id)',
};

class Command extends AliasPiece {
  constructor(store, file, directory, options = {}) {
    super(store, file, directory, options);
    this.name = options.name;
    this.description = options.description;
    this.category = options.category || file.split('/')[0];
    this.clientPermissions =
      options.clientPermissions && options.clientPermissions.length > 0 ? options.clientPermissions : ['SEND_MESSAGES'];
    this.userPermissions =
      options.userPermissions && options.userPermissions.length > 0 ? options.userPermissions : ['SEND_MESSAGES'];
    this.guildOnly = options.guildOnly;
    this.devOnly = options.devOnly;
    this.nsfw = options.nsfw;
    this.arguments = options.arguments;
  }

  run() {
    throw new Error(`Функция на запуск команды ${this.name}не указан`);
  }

  validate(args) {
    return new Promise((resolve, reject) => {
      const requiredArguments = Object.entries(this.arguments);
      if (args.length === 0 && requiredArguments.length === 0) reject(this.invalidArguments());

      if (requiredArguments.some(arg => arg[0] === 'spaceString')) {
        if (requiredArguments[requiredArguments.lastIndex] !== 'spaceString') {
          throw new Error('Аргумент типа spaceString должен быть последним');
        }

        args[requiredArguments.lastIndex] = args.slice(requiredArguments.lastIndex).join(' ');
      }

      for (const i in requiredArguments) {
        const arg = requiredArguments[i][1];

        if (!args[i] && arg.required) reject(this.invalidArguments(i));
        if (arg.pre && !arg.pre(args[i])) reject(this.invalidArguments(i));

        const regex = arg.regex || types[arg.type];
        if (!args[i].match(regex)) reject(this.invalidArguments(i));
      }

      resolve(true);
    });
  }

  invalidArguments(invalidIndex = -1) {
    const args = Object.entries(this.arguments);

    let arrowIndex = this.name.length + 1;
    const argsStrings = args.map((arg, i) => {
      if (+i < +invalidIndex) {
        arrowIndex += arg[0].length + 3;
      }
      return `${arg[1].required ? '[' : '('}${arg[0]}${arg[1].required ? ']' : ')'}`;
    });

    const spaceArray = new Array(this.name.length + argsStrings.join(' ').length).fill(' ');
    spaceArray.splice(arrowIndex + 1, 0, '👆');
    const errorArrowString = `\n\`${spaceArray.join('')}\`\n`;

    const argsDescriptions = args.map(
      (arg, i) =>
        `${i === +invalidIndex ? '__' : ''}\`${arg[0]}\`${i === +invalidIndex ? '__' : ''} **:** *${
          arg[1].description || typesDescription[arg[1].type]
        }${!arg[1].required ? ' (optional)' : ''}*`,
    );

    return new MessageEmbed()
      .setColor(colors.ERROR)
      .setDescription(
        `**Используйте:**\n\`/${this.name} ${argsStrings.join(
          ' ',
        )}\`${errorArrowString}\n\n**Аргументы:**\n${argsDescriptions.join('\n')}`,
      );
  }
}

module.exports = Command;
