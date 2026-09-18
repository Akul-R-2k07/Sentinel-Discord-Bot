const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'disconnect',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const channelOption = interaction.options.getChannel('channel');

    // Resolve up-to-date channel from cache
    const targetChannel =
      interaction.guild.channels.cache.get(channelOption.id) || channelOption;

    // 1. Verify bot permissions
    const botMember = interaction.guild.members.me;
    if (!botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
      return interaction.reply({
        content: '❌ I do not have permission to disconnect members from voice channels.',
        ephemeral: true,
      });
    }

    // 2. Check if voice channel has members
    if (!targetChannel.members || targetChannel.members.size === 0) {
      return interaction.reply({
        content: `ℹ️ There is no one connected to ${targetChannel}.`,
        ephemeral: true,
      });
    }

    // ==========================================
    // SUBCOMMAND: /disconnect all
    // ==========================================
    if (subcommand === 'all') {
      await interaction.deferReply();

      const membersToDisconnect = targetChannel.members.filter(
        (member) => member.id !== interaction.client.user.id
      );

      let disconnectedCount = 0;
      let failedCount = 0;

      await Promise.all(
        membersToDisconnect.map(async (member) => {
          try {
            await member.voice.disconnect(
              `Disconnected by ${interaction.user.tag} via /disconnect all`
            );
            disconnectedCount++;
          } catch {
            failedCount++;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setColor(failedCount > 0 ? 0xffa500 : 0xe74c3c)
        .setTitle('🔌 Voice Channel Disconnect (All)')
        .setDescription(
          `Successfully disconnected **${disconnectedCount}** member(s) from ${targetChannel}.`
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      if (failedCount > 0) {
        embed.addFields({
          name: '⚠️ Notice',
          value: `Could not disconnect **${failedCount}** member(s) due to role hierarchy limits.`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    // ==========================================
    // SUBCOMMAND: /disconnect users
    // ==========================================
    if (subcommand === 'users') {
      const targetRole = interaction.options.getRole('role');
      const nameKeyword = interaction.options.getString('name_contains')?.trim();

      // Must provide at least one filter
      if (!targetRole && !nameKeyword) {
        return interaction.reply({
          content: '❌ Please specify at least one filter option: `role` or `name_contains`.',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const membersToDisconnect = targetChannel.members.filter((member) => {
        if (member.id === interaction.client.user.id) return false;

        const matchesRole = targetRole ? member.roles.cache.has(targetRole.id) : true;
        const matchesName = nameKeyword
          ? member.displayName.toLowerCase().includes(nameKeyword.toLowerCase()) ||
            member.user.username.toLowerCase().includes(nameKeyword.toLowerCase())
          : true;

        return matchesRole && matchesName;
      });

      if (membersToDisconnect.size === 0) {
        return interaction.editReply({
          content: `ℹ️ No members in ${targetChannel} matched your filter criteria.`,
        });
      }

      let disconnectedCount = 0;
      let failedCount = 0;
      const disconnectedNames = [];

      await Promise.all(
        membersToDisconnect.map(async (member) => {
          try {
            await member.voice.disconnect(
              `Disconnected by ${interaction.user.tag} via /disconnect users`
            );
            disconnectedCount++;
            disconnectedNames.push(member.displayName);
          } catch {
            failedCount++;
          }
        })
      );

      const filterDetails = [];
      if (targetRole) filterDetails.push(`Role: **@${targetRole.name}**`);
      if (nameKeyword) filterDetails.push(`Name containing: \`${nameKeyword}\``);

      const embed = new EmbedBuilder()
        .setColor(failedCount > 0 ? 0xffa500 : 0xe74c3c)
        .setTitle('🔌 Voice Channel Disconnect (Filtered)')
        .setDescription(
          `Disconnected **${disconnectedCount}** member(s) matching ${filterDetails.join(' and ')} from ${targetChannel}.`
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      if (disconnectedNames.length > 0) {
        embed.addFields({
          name: 'Disconnected Members',
          value:
            disconnectedNames.map((name) => `• ${name}`).slice(0, 20).join('\n') +
            (disconnectedNames.length > 20 ? `\n*...and ${disconnectedNames.length - 20} more*` : ''),
        });
      }

      if (failedCount > 0) {
        embed.addFields({
          name: '⚠️ Notice',
          value: `Could not disconnect **${failedCount}** member(s) due to role hierarchy limits.`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }
  },
};