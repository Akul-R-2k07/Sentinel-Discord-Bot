const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const { generateGoodbyeCard } = require('../utils/goodbyeCard');

const CONFIG_PATH = path.join(__dirname, '..', 'bot-config.json');

function getConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  name: 'goodbye',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    const config = getConfig();
    if (!config[guildId]) config[guildId] = {};
    if (!config[guildId].goodbye) config[guildId].goodbye = {};

    // 1. /goodbye on <channel>
    if (subcommand === 'on') {
      const channel = interaction.options.getChannel('channel');
      config[guildId].goodbye.enabled = true;
      config[guildId].goodbye.channelId = channel.id;
      saveConfig(config);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('✅ Goodbye System Activated')
            .setDescription(`Wasted goodbye cards will now be sent to ${channel}.`)
            .setTimestamp(),
        ],
      });
    }

    // 2. /goodbye off
    if (subcommand === 'off') {
      config[guildId].goodbye.enabled = false;
      saveConfig(config);

      return interaction.reply({
        content: '🛑 Goodbye cards have been disabled.',
      });
    }

    // 3. /goodbye test (Preview the card right now)
    if (subcommand === 'test') {
      await interaction.deferReply();

      const cardBuffer = await generateGoodbyeCard(interaction.member);
      const attachment = new AttachmentBuilder(cardBuffer, { name: 'wasted-goodbye.png' });

      const embed = new EmbedBuilder()
        .setColor(0xe50000)
        .setDescription(`### **@${interaction.member.displayName}** has left **${interaction.guild.name}**.`)
        .setImage('attachment://wasted-goodbye.png')
        .setFooter({
          text: `Member #${interaction.guild.memberCount} • ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed], files: [attachment] });
    }
  },
};