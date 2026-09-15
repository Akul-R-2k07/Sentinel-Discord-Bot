const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'help',
  async execute(interaction) {
    const memberPerms = interaction.memberPermissions;
    const isAdmin = memberPerms.has(PermissionFlagsBits.Administrator);
    const canManageRoles = memberPerms.has(PermissionFlagsBits.ManageRoles);
    const canManageMessages = memberPerms.has(PermissionFlagsBits.ManageMessages);

    const helpEmbed = new EmbedBuilder()
      .setTitle('📖 Command Help & Guide')
      .setColor('#5865F2')
      .setDescription(`Hello **${interaction.user.username}**, here are the commands available to you:`)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp();

    helpEmbed.addFields(
      {
        name: '🌐 General & Info Commands',
        value: [
          '`/ping` — Check bot response latency.',
          '`/help` — Display commands tailored to your permissions.',
          '`/userinfo [target]` — View comprehensive activity, leveling, and channel engagement stats.',
          '`/serverinfo` — View aggregate server metrics, top channels, and engagement totals.',
        ].join('\n'),
        inline: false,
      },
      {
        name: '⭐ Leveling & Community',
        value: [
          '`/my level` — View your personal level, XP progress, and server rank.',
          '`/user level <target>` — View another member’s level card.',
          '`/leaderboard` — View the top server members ranked by level.',
        ].join('\n'),
        inline: false,
      }
    );

    if (canManageMessages || isAdmin) {
      helpEmbed.addFields({
        name: '🧹 Moderation: Purge (`Manage Messages`)',
        value: [
          '`/purge channel <channel> [amount] [hours_ago]` — Purge messages in target channel.',
          '`/purge user <target> [channel] [amount] [hours_ago]` — Purge messages authored by a member.',
          '`/purge all [amount] [hours_ago]` — Purge recent messages server-wide.',
        ].join('\n'),
        inline: false,
      });
    }

    if (canManageRoles || isAdmin) {
      helpEmbed.addFields({
        name: '👋 Welcome System (`Manage Roles`)',
        value: ['`/welcome role <role>` — Assign role automatically on join.'].join('\n'),
        inline: false,
      });
    }

    if (isAdmin) {
      helpEmbed.addFields({
        name: '🔒 Server Lockdown (`Administrator`)',
        value: [
          '`/valli on` — Start Valli lockdown.',
          '`/valli off` — Disable Valli lockdown.',
        ].join('\n'),
        inline: false,
      });
    }

    return interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  },
};