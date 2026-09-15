const { PermissionFlagsBits } = require('discord.js');
const { getConfig, saveConfig } = require('../utils/storage');

module.exports = {
  name: 'welcome',
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: '❌ You need `Manage Roles` permission to use this.',
        ephemeral: true,
      });
    }

    const selectedRole = interaction.options.getRole('role');
    if (selectedRole.id === interaction.guild.id || selectedRole.managed) {
      return interaction.reply({
        content: '❌ Cannot assign `@everyone` or integration-managed roles.',
        ephemeral: true,
      });
    }

    const config = getConfig();
    if (!config[interaction.guild.id]) config[interaction.guild.id] = {};
    config[interaction.guild.id].welcomeRoleId = selectedRole.id;
    saveConfig();

    return interaction.reply({
      content: `✅ Welcome role set to **${selectedRole.name}**!`,
    });
  },
};