const { EmbedBuilder } = require('discord.js');
const { getConfig } = require('../utils/storage');
const { logMessageActivity, isMod, addXP } = require('../utils/helpers');

const chatCooldowns = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    // 1. AUTO REACT ON USER MENTION
    if (message.mentions.users.size > 0) {
      const config = getConfig();
      const autoReacts = config[message.guild.id]?.autoReact;

      if (autoReacts) {
        for (const [userId] of message.mentions.users) {
          if (userId === message.author.id) continue;

          const preferredEmoji = autoReacts[userId];
          if (preferredEmoji) {
            message.react(preferredEmoji).catch(() => {});
          }
        }
      }
    }

    // 2. Log message activity to cache
    logMessageActivity(message.guild.id, message.author.id, message.channel.id);

    // 3. Valli Mode Check
    const config = getConfig();
    const guildData = config[message.guild.id]?.valli;
    if (guildData?.active && guildData?.roleId && !isMod(message.member)) {
      if (!message.member.roles.cache.has(guildData.roleId)) {
        await message.member.roles.add(guildData.roleId).catch(() => {});
      }
    }

    // 4. Rate-limited Chat XP (1 min cooldown)
    const cooldownKey = `${message.guild.id}-${message.author.id}`;
    const nextAllowedTime = chatCooldowns.get(cooldownKey) || 0;

    if (Date.now() >= nextAllowedTime) {
      chatCooldowns.set(cooldownKey, Date.now() + 60 * 1000);

      const xpGained = Math.floor(Math.random() * 11) + 15;
      const result = addXP(message.guild.id, message.author.id, xpGained);

      if (result.leveledUp) {
        const levelEmbed = new EmbedBuilder()
          .setColor('#2ECC71')
          .setDescription(`🎉 Congrats ${message.author}, you reached **Level ${result.level}**!`);
        message.channel.send({ embeds: [levelEmbed] }).catch(() => {});
      }
    }
  },
};