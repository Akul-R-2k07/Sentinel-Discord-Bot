const { EmbedBuilder } = require('discord.js');
const { getLevels } = require('../utils/storage');
const {
  formatDate,
  formatHours,
  getNeededXP,
  getUserActivityData,
  getEngagementRanks,
} = require('../utils/helpers');

module.exports = {
  name: 'userinfo',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    const levelsData = getLevels()[interaction.guild.id] || {};
    const userLevelInfo = levelsData[targetUser.id] || { xp: 0, level: 0, totalXp: 0 };
    const needed = getNeededXP(userLevelInfo.level);

    const activity = getUserActivityData(interaction.guild.id, targetUser.id);
    const ranks = getEngagementRanks(interaction.guild.id, targetUser.id);

    const topTextChannelDisplay = activity.messages.topChannelId
      ? `<#${activity.messages.topChannelId}> (${activity.messages.topChannelCount.toLocaleString()} msgs)`
      : 'None';

    const topVoiceChannelDisplay = activity.voice.topChannelId
      ? `<#${activity.voice.topChannelId}> (${formatHours(activity.voice.topChannelMinutes)})`
      : 'None';

    const structuredData = {
      header: {
        tag: targetUser.tag,
        displayName: member?.displayName || targetUser.username,
        serverName: interaction.guild.name,
        accountCreatedAt: formatDate(targetUser.createdAt),
        serverJoinedAt: formatDate(member?.joinedAt),
      },
      leveling: {
        level: userLevelInfo.level,
        currentXp: userLevelInfo.xp,
        totalXp: userLevelInfo.totalXp,
        threshold: needed,
        serverLevelRank: ranks.levelRank,
      },
      ranks: {
        messageRank: ranks.messageRank,
        voiceRank: ranks.voiceRank,
      },
      messages: {
        last24Hours: activity.messages.day1,
        last7Days: activity.messages.day7,
        last14Days: activity.messages.day14,
        topChannel: topTextChannelDisplay,
      },
      voice: {
        last24Hours: formatHours(activity.voice.day1Minutes),
        last7Days: formatHours(activity.voice.day7Minutes),
        last14Days: formatHours(activity.voice.day14Minutes),
        topChannel: topVoiceChannelDisplay,
      },
    };

    const infoEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${structuredData.header.displayName} (${structuredData.header.tag})`,
        iconURL: targetUser.displayAvatarURL(),
      })
      .setColor('#2B2D31')
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields({
        name: '👤 Member Profile',
        value: [
          `• **Server:** ${structuredData.header.serverName}`,
          `• **Account Created:** ${structuredData.header.accountCreatedAt}`,
          `• **Joined Server:** ${structuredData.header.serverJoinedAt}`,
        ].join('\n'),
        inline: false,
      })
      .addFields(
        {
          name: '⭐ Leveling & Progression',
          value: [
            `• **Level:** ${structuredData.leveling.level}`,
            `• **Current XP:** ${structuredData.leveling.currentXp} / ${structuredData.leveling.threshold}`,
            `• **Total XP:** ${structuredData.leveling.totalXp.toLocaleString()}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '🎖️ Server Ranks',
          value: [
            `• **Level Rank:** Level #${structuredData.leveling.serverLevelRank}`,
            `• **Message Rank:** Message #${structuredData.ranks.messageRank}`,
            `• **Voice Rank:** Voice #${structuredData.ranks.voiceRank}`,
          ].join('\n'),
          inline: true,
        }
      )
      .addFields({
        name: '💬 Message Activity Breakdown',
        value: [
          `• **Last 24 Hours (1d):** ${structuredData.messages.last24Hours.toLocaleString()} messages`,
          `• **Last 7 Days (7d):** ${structuredData.messages.last7Days.toLocaleString()} messages`,
          `• **Last 14 Days (14d):** ${structuredData.messages.last14Days.toLocaleString()} messages`,
          `• **Top Text Channel:** ${structuredData.messages.topChannel}`,
        ].join('\n'),
        inline: false,
      })
      .addFields({
        name: '🎙️ Voice Activity Breakdown',
        value: [
          `• **Last 24 Hours (1d):** ${structuredData.voice.last24Hours}`,
          `• **Last 7 Days (7d):** ${structuredData.voice.last7Days}`,
          `• **Last 14 Days (14d):** ${structuredData.voice.last14Days}`,
          `• **Top Voice Channel:** ${structuredData.voice.topChannel}`,
        ].join('\n'),
        inline: false,
      })
      .setFooter({ text: 'Activity tracked across rolling 14-day lookback window' })
      .setTimestamp();

    return interaction.reply({ embeds: [infoEmbed] });
  },
};