module.exports = {
  name: 'interactionCreate',
  async execute(interaction, context) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, context);
    } catch (error) {
      console.error(`Command error in /${interaction.commandName}:`, error);
      const replyFn = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
      await interaction[replyFn]({
        content: '❌ An error occurred while executing this command.',
        ephemeral: true,
      }).catch(() => {});
    }
  },
};