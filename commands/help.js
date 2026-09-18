const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'help',
  async execute(interaction) {
    const member = interaction.member;
    const permissions = member.permissions;

    // Permission checks
    const canModerateVoice =
      permissions.has(PermissionFlagsBits.MuteMembers) ||
      permissions.has(PermissionFlagsBits.MoveMembers) ||
      permissions.has(PermissionFlagsBits.Administrator);

    const canManageServer =
      permissions.has(PermissionFlagsBits.ManageGuild) ||
      permissions.has(PermissionFlagsBits.ManageRoles) ||
      permissions.has(PermissionFlagsBits.Administrator);

    const canModerateText =
      permissions.has(PermissionFlagsBits.ManageMessages) ||
      permissions.has(PermissionFlagsBits.Administrator);

    const isAdmin = permissions.has(PermissionFlagsBits.Administrator);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('📖 Command Directory & Help')
      .setDescription(
        'Here is the complete list of commands available to you based on your server permissions.'
      )
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    // 1. Leveling & Activity Stats (Everyone)
    embed.addFields({
      name: '📊 Leveling & Analytics',
      value: [
        '`/my level` — View your current level, XP, and rank progress.',
        '`/user level <target>` — Inspect another member’s level and XP.',
        '`/userinfo [target]` — Activity metrics over 1d, 7d, & 14d periods.',
        '`/serverinfo` — Server-wide aggregate activity and engagement stats.',
        '`/leaderboard` — Display top ranked members by level and XP.',
      ].join('\n'),
    });

    // 2. Automation & Utilities (Everyone)
    embed.addFields({
      name: '⚙️ Utilities & Automation',
      value: [
        '`/ping` — Test bot response time and WebSocket ping.',
        '`/help` — Display this interactive help directory.',
        '`/auto react <emoji>` — Auto-react with an emoji when mentioned (use `off` to disable).',
        '`/auto respond` — Set an automated text reply when mentioned.',
      ].join('\n'),
    });

    // 3. Voice Moderation (Voice Mods & Admins)
    if (canModerateVoice) {
      embed.addFields({
        name: '🔊 Voice Channel Moderation',
        value: [
          '`/mute all` — Server-mute all members in your current VC.',
          '`/mute users [role] [name_contains] [guild_tag]` — Mute members by role, name keywords, or clan/server tags.',
          '`/unmute all` — Server-unmute all members in your current VC.',
          '`/disconnect all <channel>` — Disconnect all members from a specific voice channel.',
          '`/disconnect users <channel> [role] [name_contains]` — Disconnect members by role or display name keyword.',
          '`/move all <target> [from]` — Relocate voice channel members into a destination VC.',
        ].join('\n'),
      });
    }

    // 4. Welcome & Goodbye System (Server Managers & Admins)
    if (canManageServer) {
      embed.addFields({
        name: '👋 Welcome & Goodbye System',
        value: [
          '**Welcome System:**',
          '• `/welcome on <channel>` — Activate animated welcome cards in a channel.',
          '• `/welcome off` — Disable welcome cards.',
          '• `/welcome rules <channel>` — Set the server rules channel mention.',
          '• `/welcome selfrole <channel>` — Set the self-roles channel mention.',
          '• `/welcome role <role>` — Set the auto-assigned newcomer role.',
          '• `/welcome test` — Preview the dynamic welcome card with animated GIF.',
          '',
          '**Goodbye System:**',
          '• `/goodbye on <channel>` — Activate dynamic "Wasted" goodbye cards.',
          '• `/goodbye off` — Disable goodbye cards.',
          '• `/goodbye test` — Preview the generated "Wasted" card with your avatar & name.',
        ].join('\n'),
      });
    }

    // 5. Text Moderation & Server Administration (Staff & Admins)
    if (canModerateText || isAdmin) {
      const adminLines = [];

      if (canModerateText) {
        adminLines.push(
          '`/purge channel <target_channel> [amount] [hours_ago]` — Purge messages in a channel.',
          '`/purge user <target> [amount] [channel] [hours_ago]` — Delete a specific user’s messages.',
          '`/purge all [amount] [hours_ago]` — Delete recent messages across all channels.'
        );
      }

      if (isAdmin) {
        adminLines.push('`/valli <on|off>` — Emergency server lockdown toggle.');
      }

      embed.addFields({
        name: '🛡️ Moderation & Server Lockdown',
        value: adminLines.join('\n'),
      });
    }

    return interaction.reply({ embeds: [embed] });
  },
};