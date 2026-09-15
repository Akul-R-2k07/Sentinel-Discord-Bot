const { EmbedBuilder } = require('discord.js');
const { getAnalytics, getLevels } = require('../utils/storage');
const { formatDate, formatHours, FOURTEEN_DAYS_MS } = require('../utils/helpers');

module.exports = {
  name: 'serverinfo',
  async execute(interaction) {
    const guild = interaction.guild;
    await guild.members.fetch();

    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter((m) => m.user.bot).size;
    const humanCount = totalMembers - botCount;

    const analytics = getAnalytics();
    const guildAnalytics = analytics[guild.id]?.users || {};
    const cutoff14d = Date.now() - FOURTEEN_DAYS_MS;

    let serverTotalMessages = 0;
    let serverTotalVoiceMinutes = 0;
    const textChannelVolume = {};
    const voiceChannelVolume = {};

    for (const [, userRecord] of Object.entries(guildAnalytics)) {
      for (const msg of userRecord.messages || []) {
        if (msg.t >= cutoff14d) {
          serverTotalMessages++;
          textChannelVolume[msg.c] = (textChannelVolume[msg.c] || 0) + 1;
        }
      }
      for (const vc of userRecord.voice || []) {
        if (vc.t >= cutoff14d) {
          const mins = vc.m || 1;
          serverTotalVoiceMinutes += mins;
          voiceChannelVolume[vc.c] = (voiceChannelVolume[vc.c] || 0) + mins;
        }
      }
    }

    const topTextChannels = Object.entries(textChannelVolume)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count], i) => `**#${i + 1}** <#${id}> — ${count.toLocaleString()} messages`);

    const topVoiceChannels = Object.entries(voiceChannelVolume)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, mins], i) => `**#${i + 1}** <#${id}> — ${formatHours(mins)}`);

    const levelsData = getLevels()[guild.id] || {};
    const sortedLevels = Object.entries(levelsData).sort(
      (a, b) => (b[1].totalXp || 0) - (a[1].totalXp || 0)
    );

    const highestUser = sortedLevels[0]
      ? `<@${sortedLevels[0][0]}> (Level ${sortedLevels[0][1].level}, ${sortedLevels[0][1].totalXp.toLocaleString()} Total XP)`
      : 'No active levelers yet';

    const structuredServerData = {
      header: {
        serverName: guild.name,
        totalMembers,
        humanCount,
        botCount,
        createdAt: formatDate(guild.createdAt),
        iconURL: guild.iconURL({ dynamic: true, size: 256 }),
      },
      totals: {
        totalMessages14d: serverTotalMessages,
        totalVoiceHours14d: formatHours(serverTotalVoiceMinutes),
      },
      topChannels: {
        text: topTextChannels,
        voice: topVoiceChannels,
      },
      levelingOverview: {
        highestLevelMember: highestUser,
        totalTrackedMembers: Object.keys(levelsData).length,
      },
    };

    const serverEmbed = new EmbedBuilder()
      .setTitle(`📊 Server Analytics: ${structuredServerData.header.serverName}`)
      .setColor('#5865F2')
      .setThumbnail(structuredServerData.header.iconURL)
      .addFields({
        name: '🌐 Server Details',
        value: [
          `• **Created On:** ${structuredServerData.header.createdAt}`,
          `• **Total Members:** ${structuredServerData.header.totalMembers.toLocaleString()} (${structuredServerData.header.humanCount.toLocaleString()} humans, ${structuredServerData.header.botCount.toLocaleString()} bots)`,
          `• **Tracked Levelers:** ${structuredServerData.levelingOverview.totalTrackedMembers} members`,
        ].join('\n'),
        inline: false,
      })
      .addFields({
        name: '📈 14-Day Activity Totals',
        value: [
          `• **Total Messages Sent:** ${structuredServerData.totals.totalMessages14d.toLocaleString()} messages`,
          `• **Total Voice Time Logged:** ${structuredServerData.totals.totalVoiceHours14d}`,
        ].join('\n'),
        inline: false,
      })
      .addFields({
        name: '💬 Top 3 Text Channels (Message Volume)',
        value:
          structuredServerData.topChannels.text.length > 0
            ? structuredServerData.topChannels.text.join('\n')
            : 'No message history recorded yet.',
        inline: false,
      })
      .addFields({
        name: '🎙️ Top 3 Voice Channels (Time Logged)',
        value:
          structuredServerData.topChannels.voice.length > 0
            ? structuredServerData.topChannels.voice.join('\n')
            : 'No voice history recorded yet.',
        inline: false,
      })
      .addFields({
        name: '🏆 Leveling Leader',
        value: structuredServerData.levelingOverview.highestLevelMember,
        inline: false,
      })
      .setFooter({ text: 'Rolling 14-day server analytics' })
      .setTimestamp();

    return interaction.reply({ embeds: [serverEmbed] });
  },
};