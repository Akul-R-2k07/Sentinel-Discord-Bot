const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ComponentType,
} = require('discord.js');
const { purgeFromChannel, purgeUserFromChannel } = require('../utils/purgeHelper');

module.exports = {
  name: 'purge',
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ You require `Manage Messages` permission.',
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const amount = interaction.options.getInteger('amount') ?? 100;
    const hoursAgo = interaction.options.getInteger('hours_ago');

    // 1. PURGE CHANNEL
    if (subcommand === 'channel') {
      await interaction.deferReply({ ephemeral: true });
      const targetChannel = interaction.options.getChannel('target_channel');
      const deletedCount = await purgeFromChannel(targetChannel, { amount, hoursAgo });
      await interaction.channel.send(`Successfully deleted ${deletedCount} messages in ${targetChannel}.`);
      return interaction.editReply(`✅ Purged ${deletedCount} messages.`);
    }

    // 2. PURGE USER (WITH PAGINATED SCAN)
    if (subcommand === 'user') {
      await interaction.deferReply({ ephemeral: true });
      const targetUser = interaction.options.getUser('target');
      const specificChannel = interaction.options.getChannel('channel');

      if (specificChannel) {
        const deletedCount = await purgeUserFromChannel(specificChannel, { amount, hoursAgo, targetUser });
        await interaction.channel.send(`Successfully deleted ${deletedCount} messages from ${targetUser} in ${specificChannel}.`);
        return interaction.editReply(`✅ Removed ${deletedCount} messages.`);
      } else {
        let totalDeleted = 0;
        let affected = 0;
        const textChannels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);

        for (const [, ch] of textChannels) {
          const count = await purgeUserFromChannel(ch, { amount, hoursAgo, targetUser });
          if (count > 0) {
            totalDeleted += count;
            affected++;
          }
        }
        await interaction.channel.send(`Successfully deleted ${totalDeleted} messages from ${targetUser} across ${affected} channels.`);
        return interaction.editReply(`✅ Purged ${totalDeleted} messages.`);
      }
    }

    // 3. PURGE ALL (WITH CONFIRMATION BUTTON DIALOGUE)
    if (subcommand === 'all') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('purge_all_confirm')
          .setLabel('Confirm Server Purge')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('purge_all_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      const prompt = await interaction.reply({
        content: `⚠️ **Are you sure you want to purge recent messages across ALL text channels?** (Up to ${amount} msgs per channel)`,
        components: [row],
        ephemeral: true,
        fetchReply: true,
      });

      const confirmation = await prompt
        .awaitMessageComponent({
          filter: (i) => i.user.id === interaction.user.id,
          componentType: ComponentType.Button,
          time: 30000,
        })
        .catch(() => null);

      if (!confirmation || confirmation.customId === 'purge_all_cancel') {
        return interaction.editReply({
          content: '❌ Server-wide purge cancelled.',
          components: [],
        });
      }

      await confirmation.update({
        content: '⏳ Purging messages across all channels...',
        components: [],
      });

      let totalDeleted = 0;
      let affected = 0;
      const textChannels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);

      for (const [, ch] of textChannels) {
        const count = await purgeFromChannel(ch, { amount, hoursAgo });
        if (count > 0) {
          totalDeleted += count;
          affected++;
        }
      }

      await interaction.channel.send(`Successfully deleted ${totalDeleted} messages across ${affected} channels.`);
      return interaction.editReply({
        content: `✅ Purged ${totalDeleted} messages server-wide.`,
        components: [],
      });
    }
  },
};