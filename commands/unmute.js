const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'unmute',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'all') {
      const voiceChannel = interaction.member?.voice?.channel;

      // 1. Check if user is connected to a voice channel
      if (!voiceChannel) {
        return interaction.reply({
          content: '❌ You must be connected to a voice channel to use this command.',
          ephemeral: true,
        });
      }

      // 2. Check if the bot has permission to mute/unmute members
      const botMember = interaction.guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.MuteMembers)) {
        return interaction.reply({
          content: '❌ I do not have permission to unmute members in this server.',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      // 3. Filter members in the VC that are currently server-muted
      const membersToUnmute = voiceChannel.members.filter(
        (member) => member.voice.serverMute
      );

      if (membersToUnmute.size === 0) {
        return interaction.editReply({
          content: `ℹ️ No members in **${voiceChannel.name}** are currently server-muted.`,
        });
      }

      let unmutedCount = 0;
      let failedCount = 0;

      // 4. Unmute all eligible members in parallel
      await Promise.all(
        membersToUnmute.map(async (member) => {
          try {
            await member.voice.setMute(
              false,
              `Unmuted by ${interaction.user.tag} using /unmute all`
            );
            unmutedCount++;
          } catch (error) {
            failedCount++;
          }
        })
      );

      const embed = new EmbedBuilder()
        .setColor(failedCount > 0 ? 0xffa500 : 0x2ecc71)
        .setTitle('🔊 Voice Channel Unmute')
        .setDescription(`Successfully server-unmuted **${unmutedCount}** member(s) in **${voiceChannel.name}**.`)
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      if (failedCount > 0) {
        embed.addFields({
          name: '⚠️ Notice',
          value: `Could not unmute **${failedCount}** member(s) due to role hierarchy limitations.`,
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }
  },
};