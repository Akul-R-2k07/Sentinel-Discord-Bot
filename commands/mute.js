const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'mute',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'all') {
      const voiceChannel = interaction.member?.voice?.channel;

      // 1. Verify user is connected to a voice channel
      if (!voiceChannel) {
        return interaction.reply({
          content: '❌ You must be connected to a voice channel to use this command.',
          ephemeral: true,
        });
      }

      // 2. Verify bot has permission to mute members in this guild/channel
      const botMember = interaction.guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.MuteMembers)) {
        return interaction.reply({
          content: '❌ I do not have permission to mute members in this server.',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      // 3. Filter members in the VC that are not already server-muted and not the bot itself
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

      // 4. Mute all eligible members in parallel
      await Promise.all(
        membersToMute.map(async (member) => {
          try {
            await member.voice.setMute(
              true,
              `Muted by ${interaction.user.tag} using /mute all`
            );
            mutedCount++;
          } catch (error) {
            failedCount++;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setColor(failedCount > 0 ? 0xffa500 : 0x2ecc71)
        .setTitle('🔇 Voice Channel Mute')
        .setDescription(`Successfully server-muted **${mutedCount}** member(s) in **${voiceChannel.name}**.`)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      if (failedCount > 0) {
        embed.addFields({
          name: '⚠️ Notice',
          value: `Could not mute **${failedCount}** member(s) due to role hierarchy limitations.`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }
  },
};