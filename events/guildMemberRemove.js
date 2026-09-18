const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { generateGoodbyeCard } = require('../utils/goodbyeCard');

const CONFIG_PATH = path.join(__dirname, '..', 'bot-config.json');

module.exports = {
  name: 'guildMemberRemove',
  once: false,
  async execute(member) {
    if (!fs.existsSync(CONFIG_PATH)) return;

    let config;
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
      return;
    }

    const guildConfig = config[member.guild.id];
    if (!guildConfig || !guildConfig.goodbye || !guildConfig.goodbye.enabled || !guildConfig.goodbye.channelId) {
      return;
    }

    const channel = member.guild.channels.cache.get(guildConfig.goodbye.channelId);
    if (!channel) return;

    try {
      const cardBuffer = await generateGoodbyeCard(member);
      const attachment = new AttachmentBuilder(cardBuffer, { name: 'wasted-goodbye.png' });

      const embed = new EmbedBuilder()
        .setColor(0xe50000)
        .setDescription(`### **@${member.displayName}** has left **${member.guild.name}**.`)
        .setImage('attachment://wasted-goodbye.png')
        .setFooter({
          text: `Member #${member.guild.memberCount} • ${member.guild.name}`,
          iconURL: member.guild.iconURL({ dynamic: true }),
        })
        .setTimestamp();

      await channel.send({ embeds: [embed], files: [attachment] });
    } catch (error) {
      console.error('❌ Error sending goodbye card:', error);
    }
  },
};