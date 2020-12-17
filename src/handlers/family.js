'use strict';

const { MessageEmbed } = require('discord.js');
const familyConfig = require('../utils/config').familyConfig;

exports.handleReactions = (client, reaction, reactedUser) => {
  const settings = familyConfig[reaction.message.guild.id];
  if (!settings) return;

  const { message } = reaction;
  const embed = message.embeds[0];
  if (!embed) return;
  const member = message.guild.member(reactedUser);
  if (message.author.id !== client.user.id) return;

  const invitedMember = message.mentions.members.first();
  if (!invitedMember) return;
  // eslint-disable-next-line consistent-return
  if (member.id !== invitedMember.id) return reaction.users.remove(reactedUser);

  const inviter = embed.description.match(/<.*?>/g)[0];
  const familyName = embed.description.match(/`(.*?)`/gm)[0].slice(1, -1);
  const role = message.guild.roles.cache.find(r => r.name === familyName);
  if (!role) return;

  member.roles.add(role);

  message.channel
    .send(
      inviter,
      new MessageEmbed()
        .setColor(0x0fda37)
        .setTitle('Приглашение принято')
        .setDescription(`${member} теперь член семьи \`${familyName}\``),
    )
    .then(msg => {
      msg.delete({ timeout: 5000 });
    });

  message.delete();
};

exports.getFamilyByOwner = member => {
  const settings = familyConfig[member.guild.id];
  if (!settings) return false;

  const category = member.guild.channels.cache.get(settings.categoryID);
  if (!category) return false;

  const channel = category.children.find(ch =>
    ch.permissionOverwrites.some(perms => perms.id === member.id && perms.allow.has('DEAFEN_MEMBERS', false)),
  );
  return channel;
};

exports.getFamilyByLeader = member => {
  const settings = familyConfig[member.guild.id];
  if (!settings) return false;

  const category = member.guild.channels.cache.get(settings.categoryID);
  if (!category) return false;

  const channel = category.children.find(ch =>
    ch.permissionOverwrites.some(perms => perms.id === member.id && perms.allow.has('MUTE_MEMBERS', false)),
  );
  return channel;
};

exports.getFamilyByMember = member => {
  const settings = familyConfig[member.guild.id];
  if (!settings) return false;

  const category = member.guild.channels.cache.get(settings.categoryID);
  if (!category) return false;

  const channel = category.children.find(ch =>
    member.roles.cache.some(role =>
      ch.permissionOverwrites.some(perms => perms.id === role.id && perms.allow.has('CONNECT', false)),
    ),
  );
  return channel;
};
