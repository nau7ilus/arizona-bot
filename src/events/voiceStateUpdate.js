'use strict';

module.exports = async (client, oldState, newState) => {
  if (oldState.channelID === newState.channelID) return;

  if (newState.channel) {
    const roleByChannel = newState.guild.roles.cache.find(r => r.name === newState.channel.name);
    if (roleByChannel) {
      await newState.member.roles.add(roleByChannel);
      console.log(
        `[LOG] Пользователю "%s" выдана роль "%s" по причине захода в этот канал`,
        newState.member.displayName,
        roleByChannel.name,
      );
    }
  }

  if (oldState.channel) {
    const roleByChannel = oldState.guild.roles.cache.find(r => r.name === oldState.channel.name);
    if (roleByChannel) {
      await oldState.member.roles.remove(roleByChannel);
      console.log(
        `[LOG] У пользователя "%s" снята роль "%s" по причине выхода из канала`,
        oldState.member.displayName,
        roleByChannel.name,
      );
    }
  }
};
