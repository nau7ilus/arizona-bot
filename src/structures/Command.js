'use strict';

const { Duration } = require('luxon');
const AliasPiece = require('./Base/AliasPiece');

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
    // {
    //   member: { type: 'user', required: true, description: 'fsdfhsd', regex: /dsf/g, pre: (value) => { return true; }},
    //   duration: { type: 'duration' }
    // }
    this.arguments = options.arguments;
  }

  run() {
    throw new Error(`Функция на запуск команды ${this.name}не указан`);
  }

  validate(args) {
    const requiredArguments = Object.entries(this.arguments);
    if (args.length === 0 && requiredArguments.length === 0) return false;
    // [
    //   ["member", {...}]
    //   ["duration",{...}]
    // ]

    console.log(requiredArguments);

    for (const i in requiredArguments) {
      const [key, arg] = requiredArguments[i];
      console.log(key, arg);
      // Возможно передавать описание ошибки
      if (!args[i] && arg.required) return false;
      if (arg.pre && !arg.pre(args[i])) return false;
    }

    return true;
  }
}

module.exports = Command;
