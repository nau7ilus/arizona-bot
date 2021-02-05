/* eslint-disable consistent-return */
'use strict';

const { MessageEmbed } = require('discord.js');

const supportConfig = require('../utils/config').supportSettings;

// eslint-disable-next-line consistent-return
exports.checkMainMessage = client => {
  Object.entries(supportConfig).forEach(async guildSettings => {
    const [guildID, settings] = guildSettings;
    if (!settings || !guildID) return console.error('Нет настроек #1');

    const guild = client.guilds.cache.get(guildID);
    if (!guild) return console.error('Сервер не найден #2');

    const channel = guild.channels.cache.get(settings.channelID);
    if (!channel) return console.error('Канал не найден #3');

    const messages = await channel.messages.fetch({ limit: 1 });
    if (!messages.size || messages.first().author.id !== client.user.id) {
      await channel.bulkDelete(10);
    } else if (messages.first().author.id === client.user.id) {
      const msg = messages.first();
      if (msg.reactions.cache.size !== 1 || !msg.reactions.cache.some(r => r.emoji !== '✏️')) {
        await msg.reactions.removeAll();
        return msg.react('✏️');
      }
      // eslint-disable-next-line consistent-return
      return;
    }
    const msg = await channel.send(
      new MessageEmbed()
        .setColor(0xf54278)
        .setTitle('**📝 Рады приветствовать вас в канале поддержки!**')
        .setDescription(`**${settings.phrases.mainMessage}**`)
        .setFooter('Для создания канала, нажмите на реакцию ниже'),
    );

    msg.react('✏️');
  });
};

exports.createTicket = async (client, reaction, reactedUser, settings) => {
  const { message } = reaction;

  reaction.users.remove(reactedUser);

  if (client.cooldown.support.has(reactedUser.id)) {
    return sendError(message.channel, reactedUser, 'Вы не можете в данный момент создавать тикеты');
  }

  const activeTickets = message.guild.channels.cache.filter(
    c =>
      [settings.categories.active, settings.categories.hold].includes(c.parentID) &&
      c.name === `ticket-${getTicketID(reactedUser.id)}`,
  );

  if (activeTickets.size >= 1) {
    return sendError(
      message.channel,
      reactedUser,
      `У вас уже есть активный тикет [(перейти в канал)](${getChannelURL(message.guild.id, activeTickets.first().id)})`,
      { embed: true },
    );
  }

  const perms = [
    ...message.guild.channels.cache.get(settings.categories.active).permissionOverwrites.toJSON(),
    { id: reactedUser.id, allow: ['VIEW_CHANNEL'] },
  ];

  try {
    const ticketChannel = await message.guild.channels.create(`ticket-${getTicketID(reactedUser.id)}`, {
      type: 'text',
      parent: settings.categories.active,
      permissionOverwrites: perms,
    });

    const msg = await ticketChannel.send(
      `**${settings.moderators.map(m => `<@&${m}>`).join(', ')}**`,
      new MessageEmbed()
        .setColor(0x54ffac)
        .setAuthor(message.guild.member(reactedUser).displayName, reactedUser.displayAvatarURL())
        .setTitle('**Новый тикет**')
        .setDescription(`**${settings.phrases.ticketMessage}**`)
        .setFooter('Модераторы могут использовать реакции ниже, для взаимодействия'),
    );

    msg.react('📌');
    msg.react('🔒');
    msg.react('📬');

    message.channel
      .send(
        reactedUser,
        new MessageEmbed()
          .setColor(0x84f542)
          .setTitle('**Создание тикета**')
          .setDescription(`**Канал успешно создан! [Перейти](${getChannelURL(message.guild.id, ticketChannel.id)})**`),
      )
      .then(_msg => _msg.delete({ timeout: 5000 }));

    const logChannel = message.guild.channels.cache.get(settings.logChannelID);
    if (logChannel) {
      logChannel.send(logEmbed(ticketChannel, reactedUser, 'create', true));
    }
    client.cooldown.support.add(reactedUser.id);
    setTimeout(() => client.cooldown.support.delete(reactedUser.id), settings.cooldown);
  } catch (err) {
    console.error(err);
    sendError(message.channel, reactedUser, 'произошла ошибка при создании канала');
  }
};

exports.action = (message, member, action, settings) => {
  // Check user perms
  if (!member.hasPermission('ADMINISTRATOR') && !member.roles.cache.some(r => settings.moderators.includes(r.id))) {
    return sendError(message.channel, member, 'у вас нет прав на использование этой команды', 3000);
  }

  const phrases = { active: 'открыт', hold: 'закреплен', close: 'закрыт' };

  // Check current ticket state
  const currentState = switchKeys(settings.categories)[message.channel.parentID] || null;
  if (currentState === action) {
    return sendError(message.channel, member, `тикет уже ${phrases[action]}`);
  }

  // Do specified action
  try {
    message.channel.setParent(settings.categories[action], { lockPermissions: false });

    // If it's about to be closed/opened, deny/allow user to send messages in channel
    if (action === 'active' || action === 'close') {
      message.channel.permissionOverwrites.get(message.guild.id).update({ SEND_MESSAGES: action === 'active' });
    }

    message.channel.send(logEmbed(message.channel, member, action));

    const logChannel = message.guild.channels.cache.get(settings.logChannelID);
    if (logChannel) {
      logChannel.send(logEmbed(message.channel, member, action, true));
    }
  } catch (err) {
    console.error(err);
    sendError(message.channel, member, 'произошла ошибка при изменении статуса тикета');
  }
};

function logEmbed(channel, member, action, field = false) {
  const titles = {
    create: '✏️┃ Создание тикета',
    active: '📬┃ Открытие тикета',
    hold: '📌┃ Закрепление тикета',
    close: '🔒┃ Закрытие тикета',
  };
  const colors = { create: 0x84f542, active: 0xc1ff45, hold: 0xffc240, close: 0xff5145 };
  const phrases = { create: 'создал', active: 'открыл', hold: 'закрепил', close: 'закрыл' };

  // eslint-disable-next-line capitalized-comments
  // prettier-ignore
  const embed = new MessageEmbed()
    .setTimestamp()
    .setColor(colors[action])
    .setTitle(`**${titles[action]}**`);

  if (field) {
    embed
      .addField(action !== 'create' ? '**Модератор**' : '**Пользователь**', `**${member}**`, true)
      .addField('**Тикет**', `**${channel} [${channel.name}]**`, true);
  } else {
    embed.setDescription(`**Модератор ${member} ${phrases[action]} тикет ${channel} [${channel.name}]**`);
  }

  return embed;
}

exports.handleReactions = (client, reaction, reactedUser) => {
  const settings = supportConfig[reaction.message.guild.id];
  if (!settings) return;

  const { message } = reaction;
  const member = message.guild.member(reactedUser);
  const isSupport = message.channel.id === settings.channelID;
  const isTicket = message.channel.name.startsWith('ticket-') && Object.values(settings.categories).includes(message.channel.parentID)
  
  if ((reaction.emoji.name === '✏️' && !isSupport) || isTicket) {
    reaction.users.remove(member.user);
  }

  if (reaction.emoji.name === '✏️' && isSupport) exports.createTicket(client, reaction, reactedUser, settings);
  else if (reaction.emoji.name === '🔒' && isTicket) exports.action(message, member, 'close', settings, reaction);
  else if (reaction.emoji.name === '📌' && isTicket) exports.action(message, member, 'hold', settings, reaction);
  else if (reaction.emoji.name === '📬' && isTicket) exports.action(message, member, 'active', settings, reaction);
};

exports.watchTickets = client => {
  Object.entries(supportConfig).forEach(async guildSettings => {
    const [guildID, settings] = guildSettings;
    if (!settings || !guildID) return console.error('Нет настроек #1');

    if (!settings) return console.error('Нет настроек #100');

    const guild = client.guilds.cache.get(guildID);
    if (!guild) return console.error('Сервер не найден #200');

    const category = guild.channels.cache.get(settings.categories.close);
    if (!category) return console.error('Категория не найдена #300');

    for await (const channel of category.children.array()) {
      const lastMessages = await channel.messages.fetch({ limit: 1 });
      if (lastMessages && lastMessages.first()) {
        const msg = lastMessages.first();

        if (Date.now() - msg.createdAt >= settings.deleteAfter) {
          channel.delete('Очищение категории с закрытыми жалобами');
        }
      } else {
        channel.delete('Очищение категории с закрытыми жалобами');
      }
    }
  });
};

function switchKeys(obj) {
  return Object.fromEntries(Object.entries(obj).map(e => [e[1], e[0]]));
}

function getChannelURL(guildID, channelID) {
  return `https://discord.com/channels/${guildID}/${channelID}`;
}

function getTicketID(id) {
  return id.substr(-5);
}

function sendError(channel, user, content, options = {}) {
  channel
    .send(
      options.embed
        ? [user, new MessageEmbed().setColor('RED').setDescription(`**${content}**`)]
        : `**\`[Error] \`${user}\`, ${content}\`**`,
    )
    .then(msg => msg.delete({ timeout: options.timeout || 5000 }));
}
