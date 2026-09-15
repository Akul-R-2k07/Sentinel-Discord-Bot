const { getConfig, saveConfig } = require('../utils/storage');

module.exports = {
  name: 'auto',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'react') {
      const emojiInput = interaction.options.getString('emoji').trim();
      const config = getConfig();

      if (!config[interaction.guild.id]) config[interaction.guild.id] = {};
      if (!config[interaction.guild.id].autoReact) config[interaction.guild.id].autoReact = {};

      // Disable/remove option
      if (['off', 'remove', 'clear', 'none', 'disable'].includes(emojiInput.toLowerCase())) {
        delete config[interaction.guild.id].autoReact[interaction.user.id];
        saveConfig();
        return interaction.reply({
          content: '✅ Removed your auto-reaction preference.',
          ephemeral: true,
        });
      }

      // Extract custom emoji ID if pasted as <:name:id> or <a:name:id>
      const customEmojiMatch = emojiInput.match(/<?(?:a)?:?\w{2,32}:(\d{17,20})>?/);
      const targetEmoji = customEmojiMatch ? customEmojiMatch[1] : emojiInput;

      const reply = await interaction.reply({
        content: `Testing emoji: ${emojiInput}...`,
        fetchReply: true,
      });

      try {
        await reply.react(targetEmoji);

        config[interaction.guild.id].autoReact[interaction.user.id] = targetEmoji;
        saveConfig();

        return interaction.editReply({
          content: `✅ Successfully set! Whenever someone mentions you, I will react with ${emojiInput}. (Type \`/auto react emoji:off\` to remove)`,
        });
      } catch (err) {
        return interaction.editReply({
          content: `❌ Could not use that emoji. Please make sure it is a valid standard Unicode emoji or a custom emoji from a server I am in.`,
        });
      }
    }
  },
};