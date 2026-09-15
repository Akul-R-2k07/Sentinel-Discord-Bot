const { renderLevelCard } = require('../utils/helpers');

module.exports = {
  name: 'my',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'level') {
      const embed = renderLevelCard(interaction.guild.id, interaction.user);
      return interaction.reply({ embeds: [embed] });
    }
  },
};