module.exports = {
  name: 'ping',
  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    return interaction.editReply({
      content: `🏓 Pong! Responded in **${latency}ms**. (API Latency: **${Math.round(interaction.client.ws.ping)}ms**)`,
    });
  },
};