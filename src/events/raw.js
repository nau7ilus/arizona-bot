'use strict';

module.exports = async (client, packet) => {
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;
  const { d: data } = packet;

  if (!client.channels.cache.get(data.channel_id)) return;

  const channel = await client.channels.resolve(data.channel_id);
  if (channel.messages.cache.has(data.message_id)) return;

  const user = await client.users.fetch(data.user_id);
  const message = await channel.messages.fetch(data.message_id);
  const reaction = await message.reactions.resolve(data.emoji.id || data.emoji.name);

  if (packet.t === 'MESSAGE_REACTION_ADD') {
    client.emit('messageReactionAdd', reaction, user);
  }
  if (packet.t === 'MESSAGE_REACTION_REMOVE') {
    client.emit('messageReactionRemove', reaction, user);
  }
};
