const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'bot-config.json');

function getGuildConfig(guildId) {
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, '{}', 'utf8');
  }
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8') || '{}');
  if (!data[guildId]) {
    data[guildId] = { valli: { active: false }, autoReact: {}, autoRespond: {} };
  }
  if (!data[guildId].autoRespond) {
    data[guildId].autoRespond = {};
  }
  if (!data[guildId].autoReact) {
    data[guildId].autoReact = {};
  }
  return { allData: data, guildConfig: data[guildId] };
}

module.exports = {
  name: 'auto',
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'respond') {
      const { guildConfig } = getGuildConfig(interaction.guild.id);
      const existingMessage = guildConfig.autoRespond[interaction.user.id] || '';

      const modal = new ModalBuilder()
        .setCustomId('auto_respond_modal')
        .setTitle('Auto Respond Setup');

      const messageInput = new TextInputBuilder()
        .setCustomId('auto_respond_text')
        .setLabel('Message when someone mentions you')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Type your response here (or type "off" / leave blank to disable)...')
        .setValue(existingMessage)
        .setMaxLength(1000)
        .setRequired(false);

      const actionRow = new ActionRowBuilder().addComponents(messageInput);
      modal.addComponents(actionRow);

      return interaction.showModal(modal);
    }

    if (sub === 'react') {
      const emoji = interaction.options.getString('emoji');
      const { allData, guildConfig } = getGuildConfig(interaction.guild.id);

      if (emoji.toLowerCase() === 'off') {
        delete guildConfig.autoReact[interaction.user.id];
        fs.writeFileSync(configPath, JSON.stringify(allData, null, 2));
        return interaction.reply({ content: '✅ Removed your auto-reaction.', ephemeral: true });
      }

      guildConfig.autoReact[interaction.user.id] = emoji;
      fs.writeFileSync(configPath, JSON.stringify(allData, null, 2));
      return interaction.reply({ content: `✅ Auto-react set to: ${emoji}`, ephemeral: true });
    }
  },
};