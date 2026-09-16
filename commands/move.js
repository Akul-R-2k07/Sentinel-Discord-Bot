const { PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  name: 'move',
  async execute(interaction) {
    // 1. Verify user permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
      return interaction.reply({
        content: '❌ You do not have the **Move Members** permission.',
        ephemeral: true,
      });
    }

    // 2. Verify bot permissions
    const botMember = interaction.guild.members.me;
    if (!botMember.permissions.has(PermissionFlagsBits.MoveMembers)) {
      return interaction.reply({
        content: '❌ I do not have permission to **Move Members** in this server.',
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'all') {
      const targetChannel = interaction.options.getChannel('target');
      const fromChannel = interaction.options.getChannel('from');

      // Prevent moving to the exact same channel
      if (fromChannel && fromChannel.id === targetChannel.id) {
        return interaction.reply({
          content: '❌ Target channel and source channel cannot be the same.',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      // Gather members to move
      let membersToMove = [];

      if (fromChannel) {
        // Only members from the specific voice channel
        membersToMove = Array.from(fromChannel.members.values());
      } else {
        // All members across all voice channels, except the destination channel
        for (const [, channel] of interaction.guild.channels.cache) {
          if (
            (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) &&
            channel.id !== targetChannel.id
          ) {
            membersToMove.push(...channel.members.values());
          }
        }
      }

      if (membersToMove.length === 0) {
        return interaction.editReply({
          content: fromChannel
            ? `⚠️ No members found connected to ${fromChannel}.`
            : `⚠️ There are currently no members in any other voice channels.`,
        });
      }

      let movedCount = 0;
      let failedCount = 0;

      for (const member of membersToMove) {
        try {
          // Verify member is still connected and not already in the target
          if (member.voice.channelId && member.voice.channelId !== targetChannel.id) {
            await member.voice.setChannel(targetChannel);
            movedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      let response = fromChannel
        ? `✅ Successfully moved **${movedCount}** member(s) from ${fromChannel} to ${targetChannel}.`
        : `✅ Successfully moved **${movedCount}** member(s) to ${targetChannel}.`;

      if (failedCount > 0) {
        response += `\n⚠️ Could not move ${failedCount} member(s) (disconnected or role hierarchy limit).`;
      }

      return interaction.editReply({ content: response });
    }
  },
};