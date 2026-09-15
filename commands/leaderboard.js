const { EmbedBuilder } = require('discord.js');
const { getLevels } = require('../utils/storage');

module.exports = {
  name: 'leaderboard',
  async execute(interaction) {
    const data = getLevels();
    const guildLevels = data[interaction.guild.id] || {};

    const sortedUsers = Object.entries(guildLevels)
      .map(([id, info]) => ({ id, ...info }))
      .sort((a, b) => b.totalXp - a.totalXp)
      .slice(0, 10);

    if (sortedUsers.length === 0) {
      return interaction.reply({
        content: '📊 There are no ranked members on the leaderboard yet. Start chatting or join a VC!',
        ephemeral: true,
      });
    }

    const medals = ['🥇', '🥈', '🥉'];
    const leaderboardRows = sortedUsers.map((user, index) => {
      const position = medals[index] || `\`#${index + 1}\``;
      return `${position} <@${user.id}> — **Level ${user.level}** (${user.totalXp.toLocaleString()} Total XP)`;
    });

    const leaderboardEmbed = new EmbedBuilder()
      .setTitle(`🏆 ${interaction.guild.name} Leaderboard`)
      .setColor('#F1C40F')
      .setDescription(leaderboardRows.join('\n\n'))
      .setThumbnail(interaction.guild.iconURL())
      .setFooter({ text: 'Top 10 active members' })
      .setTimestamp();

    return interaction.reply({ embeds: [leaderboardEmbed] });
  },
};