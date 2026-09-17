const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'help',
  async execute(interaction) {
    const member = interaction.member;
    const permissions = member.permissions;

    // Check member permissions to dynamically show/hide sections
    const canModerateVoice =
      permissions.has(PermissionFlagsBits.MuteMembers) ||
      permissions.has(PermissionFlagsBits.MoveMembers) ||
      permissions.has(PermissionFlagsBits.Administrator);

    const canModerateText =
      permissions.has(PermissionFlagsBits.ManageMessages) ||
      permissions.has(PermissionFlagsBits.Administrator);

    const canAdminServer =
      permissions.has(PermissionFlagsBits.ManageRoles) ||
      permissions.has(PermissionFlagsBits.Administrator);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📖 Command Directory & Help')
      .setDescription(
        'Here is a list of commands available to you based on your server permissions.'
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    // 1. Leveling & Activity Stats (Available to everyone)
    embed.addFields({
      name: '📊 Leveling & Analytics',
      value: [
        '`/my level` — View your current level, XP, and rank progress.',
        '`/user level <target>` — Inspect another member’s level and XP.',
        '`/userinfo [target]` — Activity metrics over 1d, 7d, & 14d periods.',
        '`/serverinfo` — Server-wide activity, top channels, & engagement stats.',
        '`/leaderboard` — Display top ranked members by level and XP.',
      ].join('\n'),
    });

    // 2. Automation & Utility (Available to everyone)
    embed.addFields({
      name: '⚙️ Utilities & Mentions',
      value: [
        '`/ping` — Test bot latency and WebSocket ping.',
        '`/help` — Display this interactive help directory.',
        '`/auto react <emoji>` — Auto-react with an emoji when mentioned (use `off` to disable).',
        '`/auto respond` — Set an automated message reply when mentioned.',
      ].join('\n'),
    });

    // 3. Voice Moderation (Shown if user has Mute/Move permissions)
    if (canModerateVoice) {
      embed.addFields({
        name: '🔊 Voice Channel Moderation',
        value: [
          '`/mute all` — Server-mute all members in your current VC.',
          '`/mute users` — Filter-mute in your VC using `role`, `name_contains`, or `guild_tag` (e.g. `CGC` or `any`).',
          '`/unmute all` — Server-unmute all members in your current VC.',
          '`/move all <target> [from]` — Relocate voice channel members into a destination VC.',
        ].join('\n'),
      });
    }

    // 4. Message Moderation & Server Administration (Shown if user has Manage Messages/Roles/Admin)
    if (canModerateText || canAdminServer) {
      const adminLines = [];

      if (canModerateText) {
        adminLines.push(
          '`/purge channel <target_channel> [amount] [hours_ago]` — Purge messages in a channel.',
          '`/purge user <target> [amount] [channel] [hours_ago]` — Delete a specific user’s messages.',
          '`/purge all [amount] [hours_ago]` — Delete recent messages across all channels.'
        );
      }

      if (permissions.has(PermissionFlagsBits.ManageRoles) || permissions.has(PermissionFlagsBits.Administrator)) {
        adminLines.push('`/welcome role <role>` — Set auto-assigned role for newcomers.');
      }

      if (permissions.has(PermissionFlagsBits.Administrator)) {
        adminLines.push('`/valli <on|off>` — Toggle emergency lockdown mode.');
      }

      embed.addFields({
        name: '🛡️ Server Moderation & Administration',
        value: adminLines.join('\n'),
      });
    }

    return interaction.reply({ embeds: [embed] });
  },
};