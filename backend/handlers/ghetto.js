'use strict';

const { MessageEmbed, Util } = require('discord.js');
const { escapeMarkdown } = Util;

const rolesToPing = ['772869388302811238', '772869388302811241'];
const triggerWords = { забив: 0, отбив: 1, мороз: 2, перенос: 3 };

const embedColors = {
  забив: 0xf887e6,
  отбив: 0xfff352,
  мороз: 0x00e5ff,
  перенос: 0x8142ff,
};

const embedTitles = {
  забив: 'Забив капта',
  отбив: 'Отбив капта',
  мороз: 'Мороз банды',
  перенос: 'Перенос капта',
};

const adminRoles = ['772869388310806569', '772869388310806570', '772869388310806571', '772869388310806572'];

const getAction = message => {
  let action;
  for (const word in triggerWords) {
    if (message.content.toLowerCase().includes(word)) return (action = word);
  }
  return action;
};

const sendRequest = message => {
  const action = getAction(message);
  console.log(action);
  const embed = new MessageEmbed()
    .setColor(embedColors[action])
    .setAuthor(message.member.displayName, message.author.displayAvatarURL({ dynamic: true }))
    .setTitle(`**${embedTitles[action]}**`)
    .setDescription(
      `**\`\`\`${escapeMarkdown(message.content)}\`\`\`` +
        `\n\`✅ - одобрить ${action}\n❌ - отклонить\n🗑️ - удалить сообщение\`**`,
    )
    .setThumbnail('https://i.imgur.com/02vFqrJ.png')
    .setFooter('Отправлено с Discord')
    .setTimestamp();

  message.channel.send(rolesToPing.map(r => `<@&${r}>`).join(', '), embed);
};

const handleMessage = message => {
  // Validate message
  if (!Object.keys(triggerWords).some(w => message.content.toLowerCase().includes(w))) {
    // If it's an admin, don't delete message
    if (message.member.hasPermission('ADMINISTRATOR') || message.member.roles.some(r => adminRoles.includes(r.id))) {
      return;
    }
  } else {
    sendRequest(message);
  }

  message.delete();
};

module.exports = { handleMessage, triggerWords };
