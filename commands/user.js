const { renderLevelCard } = require('../utils/helpers');

module.exports = {
  name: 'user',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'level') {
      const targetUser = interaction.options.getUser('target');
      const embed = renderLevelCard(interaction.guild.id, targetUser);
      return interaction.reply({ embeds: [embed] });
    }
  },
};