const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'bot-config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, context) {
    // 1. Handle Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, context);
      } catch (error) {
        console.error(error);
        const reply = { content: '❌ An error occurred while executing this command.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      }
      return;
    }

    // 2. Handle Text Box (Modal) Submission for Auto Respond
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'auto_respond_modal') {
        const responseText = interaction.fields.getTextInputValue('auto_respond_text').trim();

        if (!fs.existsSync(configPath)) {
          fs.writeFileSync(configPath, '{}', 'utf8');
        }
        const data = JSON.parse(fs.readFileSync(configPath, 'utf8') || '{}');
        const guildId = interaction.guild.id;

        if (!data[guildId]) data[guildId] = {};
        if (!data[guildId].autoRespond) data[guildId].autoRespond = {};

        // If left empty or typed 'off', remove auto response
        if (!responseText || responseText.toLowerCase() === 'off') {
          delete data[guildId].autoRespond[interaction.user.id];
          fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
          return interaction.reply({
            content: '✅ Your auto-response has been disabled.',
            ephemeral: true,
          });
        }

        // Save the custom message
        data[guildId].autoRespond[interaction.user.id] = responseText;
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2));

        return interaction.reply({
          content: `✅ Auto-response saved! When someone mentions you, the bot will reply with:\n> ${responseText.replace(/\n/g, '\n> ')}`,
          ephemeral: true,
        });
      }
    }
  },
};