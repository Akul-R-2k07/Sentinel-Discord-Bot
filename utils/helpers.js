const { EmbedBuilder } = require('discord.js');
const { getLevels, saveLevels, getAnalytics, saveAnalytics } = require('./storage');

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function formatDate(date) {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function formatHours(minutes) {
  const hours = (minutes / 60).toFixed(2);
  return `${hours} hours`;
}

function getNeededXP(level) {
  return 5 * level * level + 50 * level + 100;
}

function createProgressBar(current, max, size = 12) {
  const percentage = Math.min(Math.max(current / max, 0), 1);
  const progress = Math.round(size * percentage);
  const emptyProgress = size - progress;
  return '█'.repeat(progress) + '░'.repeat(emptyProgress);
}

function addXP(guildId, userId, amount) {
  const data = getLevels();
  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) {
    data[guildId][userId] = { xp: 0, level: 0, totalXp: 0 };
  }

  const user = data[guildId][userId];
  user.xp += amount;
  user.totalXp += amount;

  let needed = getNeededXP(user.level);
  let leveledUp = false;

  while (user.xp >= needed) {
    user.xp -= needed;
    user.level += 1;
    needed = getNeededXP(user.level);
    leveledUp = true;
  }

  saveLevels();
  return { leveledUp, level: user.level, totalXp: user.totalXp, xp: user.xp, needed };
}

function logMessageActivity(guildId, userId, channelId) {
  const analytics = getAnalytics();
  if (!analytics[guildId]) analytics[guildId] = { users: {} };
  if (!analytics[guildId].users[userId]) {
    analytics[guildId].users[userId] = { messages: [], voice: [] };
  }

  const now = Date.now();
  const cutoff = now - FOURTEEN_DAYS_MS;

  const userRecord = analytics[guildId].users[userId];
  userRecord.messages = (userRecord.messages || []).filter((entry) => entry.t >= cutoff);
  userRecord.messages.push({ t: now, c: channelId });

  saveAnalytics();
}

function logVoiceActivity(guildId, userId, channelId, minutes = 1) {
  const analytics = getAnalytics();
  if (!analytics[guildId]) analytics[guildId] = { users: {} };
  if (!analytics[guildId].users[userId]) {
    analytics[guildId].users[userId] = { messages: [], voice: [] };
  }

  const now = Date.now();
  const cutoff = now - FOURTEEN_DAYS_MS;

  const userRecord = analytics[guildId].users[userId];
  userRecord.voice = (userRecord.voice || []).filter((entry) => entry.t >= cutoff);
  userRecord.voice.push({ t: now, c: channelId, m: minutes });

  saveAnalytics();
}

function getUserActivityData(guildId, userId) {
  const analytics = getAnalytics();
  const userRecord = analytics[guildId]?.users?.[userId] || { messages: [], voice: [] };
  const now = Date.now();

  const dayCutoff = now - 24 * 60 * 60 * 1000;
  const sevenDayCutoff = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDayCutoff = now - 14 * 24 * 60 * 60 * 1000;

  let msg1d = 0, msg7d = 0, msg14d = 0;
  const textChannelCounts = {};

  for (const entry of userRecord.messages || []) {
    if (entry.t >= fourteenDayCutoff) {
      msg14d++;
      textChannelCounts[entry.c] = (textChannelCounts[entry.c] || 0) + 1;
    }
    if (entry.t >= sevenDayCutoff) msg7d++;
    if (entry.t >= dayCutoff) msg1d++;
  }

  let topTextChannelId = null;
  let maxTextMsgs = 0;
  for (const [chId, count] of Object.entries(textChannelCounts)) {
    if (count > maxTextMsgs) {
      maxTextMsgs = count;
      topTextChannelId = chId;
    }
  }

  let voice1dMin = 0, voice7dMin = 0, voice14dMin = 0;
  const voiceChannelMinutes = {};

  for (const entry of userRecord.voice || []) {
    const mins = entry.m || 1;
    if (entry.t >= fourteenDayCutoff) {
      voice14dMin += mins;
      voiceChannelMinutes[entry.c] = (voiceChannelMinutes[entry.c] || 0) + mins;
    }
    if (entry.t >= sevenDayCutoff) voice7dMin += mins;
    if (entry.t >= dayCutoff) voice1dMin += mins;
  }

  let topVoiceChannelId = null;
  let maxVoiceMins = 0;
  for (const [chId, mins] of Object.entries(voiceChannelMinutes)) {
    if (mins > maxVoiceMins) {
      maxVoiceMins = mins;
      topVoiceChannelId = chId;
    }
  }

  return {
    messages: {
      day1: msg1d,
      day7: msg7d,
      day14: msg14d,
      topChannelId: topTextChannelId,
      topChannelCount: maxTextMsgs,
    },
    voice: {
      day1Minutes: voice1dMin,
      day7Minutes: voice7dMin,
      day14Minutes: voice14dMin,
      topChannelId: topVoiceChannelId,
      topChannelMinutes: maxVoiceMins,
    },
  };
}

function getEngagementRanks(guildId, targetUserId) {
  const analytics = getAnalytics();
  const guildUsers = analytics[guildId]?.users || {};
  const levelsData = getLevels()[guildId] || {};

  const levelRankList = Object.entries(levelsData)
    .map(([id, data]) => ({ id, totalXp: data.totalXp || 0 }))
    .sort((a, b) => b.totalXp - a.totalXp);
  const lIdx = levelRankList.findIndex((u) => u.id === targetUserId);
  const levelRank = lIdx === -1 ? levelRankList.length + 1 : lIdx + 1;

  const msgRankList = Object.entries(guildUsers)
    .map(([id, rec]) => ({ id, count: (rec.messages || []).length }))
    .sort((a, b) => b.count - a.count);
  const mIdx = msgRankList.findIndex((u) => u.id === targetUserId);
  const messageRank = mIdx === -1 ? msgRankList.length + 1 : mIdx + 1;

  const voiceRankList = Object.entries(guildUsers)
    .map(([id, rec]) => ({
      id,
      totalMin: (rec.voice || []).reduce((acc, v) => acc + (v.m || 1), 0),
    }))
    .sort((a, b) => b.totalMin - a.totalMin);
  const vIdx = voiceRankList.findIndex((u) => u.id === targetUserId);
  const voiceRank = vIdx === -1 ? voiceRankList.length + 1 : vIdx + 1;

  return { levelRank, messageRank, voiceRank };
}

function renderLevelCard(guildId, targetUser) {
  const guildLevels = getLevels()[guildId] || {};
  const userData = guildLevels[targetUser.id] || { xp: 0, level: 0, totalXp: 0 };

  const sortedUsers = Object.entries(guildLevels)
    .map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => b.totalXp - a.totalXp);

  const rankIndex = sortedUsers.findIndex((u) => u.id === targetUser.id);
  const rank = rankIndex === -1 ? sortedUsers.length + 1 : rankIndex + 1;

  const needed = getNeededXP(userData.level);
  const bar = createProgressBar(userData.xp, needed, 12);
  const percentage = Math.floor((userData.xp / needed) * 100);

  return new EmbedBuilder()
    .setAuthor({ name: `${targetUser.username}'s Level Card`, iconURL: targetUser.displayAvatarURL() })
    .setColor('#3498DB')
    .setThumbnail(targetUser.displayAvatarURL())
    .addFields(
      { name: '🎖️ Rank', value: `#${rank}`, inline: true },
      { name: '⭐ Level', value: `${userData.level}`, inline: true },
      { name: '✨ Total XP', value: `${userData.totalXp.toLocaleString()}`, inline: true },
      {
        name: `Progress to Level ${userData.level + 1}`,
        value: `\`${bar}\` **${percentage}%**\n(${userData.xp} / ${needed} XP)`,
        inline: false,
      }
    )
    .setFooter({ text: 'Earn 15-25 XP per minute chatting or talking in VC!' })
    .setTimestamp();
}

function isMod(member) {
  if (!member || !member.permissions) return false;
  return (
    member.permissions.has('Administrator') ||
    member.permissions.has('ManageGuild') ||
    member.permissions.has('ManageMessages')
  );
}

module.exports = {
  FOURTEEN_DAYS_MS,
  formatDate,
  formatHours,
  getNeededXP,
  createProgressBar,
  addXP,
  logMessageActivity,
  logVoiceActivity,
  getUserActivityData,
  getEngagementRanks,
  renderLevelCard,
  isMod,
};