const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'bot-config.json');
const cooldowns = new Map();
const COOLDOWN_TIME = 10000; // 10 seconds cooldown per user to prevent ping spam

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;
    if (message.mentions.users.size === 0) return;

    if (!fs.existsSync(configPath)) return;
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8') || '{}');
    const guildConfig = data[message.guild.id];
    if (!guildConfig) return;

    const autoRespond = guildConfig.autoRespond || {};
    const autoReact = guildConfig.autoReact || {};

    for (const [userId, targetUser] of message.mentions.users) {
      // Ignore if a user mentioned themselves
      if (userId === message.author.id) continue;

      // Auto Reaction Trigger
      if (autoReact[userId]) {
        try {
          await message.react(autoReact[userId]);
        } catch {
          // Ignored if reaction fails or bot lacks permissions
        }
      }

      // Auto Response Trigger
      if (autoRespond[userId]) {
        const now = Date.now();
        const lastTriggered = cooldowns.get(userId) || 0;

        // Skip if still on cooldown
        if (now - lastTriggered < COOLDOWN_TIME) continue;
        cooldowns.set(userId, now);

        try {
          await message.reply({
            content: `💬 **${targetUser.displayName}**:\n${autoRespond[userId]}`,
            allowedMentions: { parse: [], repliedUser: true },
          });
        } catch (err) {
          console.error('Failed to reply with auto-response:', err);
        }
      }
    }
  },
};