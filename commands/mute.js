const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function checkGuildTagMatch(member, query) {
  const queryLower = query.toLowerCase().trim();

  let user = member.user;
  try {
    user = await member.client.users.fetch(member.id, { force: true });
  } catch {
    user = member.user;
  }

  const officialTag = user?.clan?.tag?.toLowerCase() || null;
  if (queryLower === 'any') {
    if (officialTag) return true;
  } else if (officialTag && officialTag === queryLower) {
    return true;
  }

  const names = [
    member.displayName,
    member.user.globalName,
    member.user.username,
  ]
    .filter(Boolean)
    .map((n) => n.toLowerCase());

  for (const name of names) {
    if (queryLower === 'any') {
      if (/(\[|\(|\{)[a-z0-9_-]{2,8}(\]|\)|\})/i.test(name)) return true;
    } else {
      if (
        name.includes(`[${queryLower}]`) ||
        name.includes(`(${queryLower})`) ||
        name.includes(`{${queryLower}}`) ||
        name.includes(`<${queryLower}>`)
      ) {
        return true;
      }

      if (
        name.includes(`${queryLower} |`) ||
        name.includes(`| ${queryLower}`) ||
        name.includes(`${queryLower} -`) ||
        name.includes(`- ${queryLower}`) ||
        name.includes(`${queryLower} •`) ||
        name.includes(`• ${queryLower}`)
      ) {
        return true;
      }

      const wordRegex = new RegExp(`(^|[\\s_.])${escapeRegex(queryLower)}([\\s_.]|$)`, 'i');
      if (wordRegex.test(name)) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  name: 'mute',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You must be connected to a voice channel to use this command.',
        ephemeral: true,
      });
    }

    const botMember = interaction.guild.members.me;
    if (!botMember.permissions.has(PermissionFlagsBits.MuteMembers)) {
      return interaction.reply({
        content: '❌ I do not have permission to mute members in this server.',
        ephemeral: true,
      });
    }

    // ==========================================
    // SUBCOMMAND: /mute all
    // ==========================================
    if (subcommand === 'all') {
      await interaction.deferReply();

      const membersToMute = voiceChannel.members.filter(
        (member) => !member.voice.serverMute && member.id !== interaction.client.user.id
      );

      if (membersToMute.size === 0) {
        return interaction.editReply({
          content: `ℹ️ All members in **${voiceChannel.name}** are already muted.`,
        });
      }

      let mutedCount = 0;
      let failedCount = 0;

      await Promise.all(
        membersToMute.map(async (member) => {
          try {
            await member.voice.setMute(true, `Muted by ${interaction.user.tag} via /mute all`);
            mutedCount++;
          } catch {
            failedCount++;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setColor(failedCount > 0 ? 0xffa500 : 0x2ecc71)
        .setTitle('🔇 Voice Channel Mute (All)')
        .setDescription(`Successfully server-muted **${mutedCount}** member(s) in **${voiceChannel.name}**.`)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      if (failedCount > 0) {
        embed.addFields({
          name: '⚠️ Notice',
          value: `Could not mute **${failedCount}** member(s) due to role hierarchy limits.`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    // ==========================================
    // SUBCOMMAND: /mute users
    // ==========================================
    if (subcommand === 'users') {
      const targetRole = interaction.options.getRole('role');
      const nameKeyword = interaction.options.getString('name_contains')?.trim();
      const guildTagQuery = interaction.options.getString('guild_tag')?.trim();

      if (!targetRole && !nameKeyword && !guildTagQuery) {
        return interaction.reply({
          content: '❌ Please specify at least one filter option: `role`, `name_contains`, or `guild_tag`.',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const membersToMute = [];
      for (const [, member] of voiceChannel.members) {
        if (member.id === interaction.client.user.id) continue;
        if (member.voice.serverMute) continue;

        const matchesRole = targetRole ? member.roles.cache.has(targetRole.id) : true;
        const matchesName = nameKeyword
          ? member.displayName.toLowerCase().includes(nameKeyword.toLowerCase())
          : true;

        let matchesGuildTag = true;
        if (guildTagQuery) {
          matchesGuildTag = await checkGuildTagMatch(member, guildTagQuery);
        }

        if (matchesRole && matchesName && matchesGuildTag) {
          membersToMute.push(member);
        }
      }

      if (membersToMute.length === 0) {
        return interaction.editReply({
          content: `ℹ️ No unmuted members in **${voiceChannel.name}** matched your filter criteria.`,
        });
      }

      let mutedCount = 0;
      let failedCount = 0;
      const mutedUsernames = [];

      await Promise.all(
        membersToMute.map(async (member) => {
          try {
            await member.voice.setMute(
              true,
              `Muted by ${interaction.user.tag} via /mute users`
            );
            mutedCount++;
            mutedUsernames.push(member.displayName);
          } catch {
            failedCount++;
          }
        })
      );

      const filterDetails = [];
      if (targetRole) filterDetails.push(`Role: **@${targetRole.name}**`);
      if (nameKeyword) filterDetails.push(`Name containing: \`${nameKeyword}\``);
      if (guildTagQuery) filterDetails.push(`Server/Guild Tag: \`${guildTagQuery}\``);

      const embed = new EmbedBuilder()
        .setColor(failedCount > 0 ? 0xffa500 : 0x2ecc71)
        .setTitle('🔇 Voice Channel Mute (Filtered)')
        .setDescription(
          `Muted **${mutedCount}** member(s) matching ${filterDetails.join(' and ')} in **${voiceChannel.name}**.`
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      if (mutedUsernames.length > 0) {
        embed.addFields({
          name: 'Targeted Members',
          value:
            mutedUsernames.map((name) => `• ${name}`).slice(0, 20).join('\n') +
            (mutedUsernames.length > 20 ? `\n*...and ${mutedUsernames.length - 20} more*` : ''),
        });
      }

      if (failedCount > 0) {
        embed.addFields({
          name: '⚠️ Notice',
          value: `Could not mute **${failedCount}** member(s) due to role hierarchy limits.`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }
  },
};