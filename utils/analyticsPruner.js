const fs = require('fs');
const path = require('path');

const ANALYTICS_FILE = path.join(__dirname, '..', 'analytics.json');
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Prunes message and voice records older than 14 days from analytics.json.
 * Does not touch levels.json, ensuring user levels and XP remain intact.
 */
function pruneAnalytics() {
  if (!fs.existsSync(ANALYTICS_FILE)) return;

  try {
    const rawData = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
    const analytics = JSON.parse(rawData);
    const cutoff = Date.now() - FOURTEEN_DAYS_MS;
    let prunedMessages = 0;
    let prunedVoice = 0;

    for (const guildId in analytics) {
      const guildData = analytics[guildId];
      if (!guildData || !guildData.users) continue;

      for (const userId in guildData.users) {
        const userStats = guildData.users[userId];

        // 1. Prune messages older than 14 days
        if (Array.isArray(userStats.messages)) {
          const initialLen = userStats.messages.length;
          userStats.messages = userStats.messages.filter((msg) => {
            const timestamp = typeof msg === 'number' ? msg : msg.t;
            return timestamp && timestamp >= cutoff;
          });
          prunedMessages += initialLen - userStats.messages.length;
        }

        // 2. Prune voice entries older than 14 days
        if (Array.isArray(userStats.voice)) {
          const initialLen = userStats.voice.length;
          userStats.voice = userStats.voice.filter((entry) => {
            const timestamp = entry.t || entry.end || entry.start;
            return timestamp ? timestamp >= cutoff : true;
          });
          prunedVoice += initialLen - userStats.voice.length;
        }
      }
    }

    if (prunedMessages > 0 || prunedVoice > 0) {
      // Atomic write: write to temp file then rename to prevent corruption
      const tempFile = `${ANALYTICS_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(analytics, null, 2), 'utf-8');
      fs.renameSync(tempFile, ANALYTICS_FILE);

      console.log(
        `🧹 [Analytics Pruner] Pruned ${prunedMessages} messages and ${prunedVoice} voice records older than 14 days.`
      );
    }
  } catch (error) {
    console.error('❌ [Analytics Pruner] Error pruning analytics data:', error);
  }
}

/**
 * Starts scheduled pruning (runs immediately, then every X hours).
 * @param {number} intervalHours - Interval in hours (default: 6 hours)
 */
function startAnalyticsPruning(intervalHours = 6) {
  pruneAnalytics(); // Run once at startup
  const intervalMs = intervalHours * 60 * 60 * 1000;
  setInterval(pruneAnalytics, intervalMs);
}

module.exports = { pruneAnalytics, startAnalyticsPruning };