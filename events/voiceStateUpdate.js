const { AuditLogEvent } = require('discord.js');
const { getConfig } = require('../utils/storage');
const { isMod } = require('../utils/helpers');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, context) {
    const config = getConfig();
    const guildData = config[newState.guild.id]?.valli;

    if (!guildData || !guildData.active) return;

    const member = newState.member;
    if (!member || member.user.bot) return;
    if (isMod(member)) return;

    if (!newState.channelId) {
      context.exemptVoiceUsers.delete(member.id);
      return;
    }

    if (guildData.roleId && !member.roles.cache.has(guildData.roleId)) {
      await member.roles.add(guildData.roleId).catch(() => {});
    }

    if (newState.channelId === guildData.voiceChannelId) return;

    try {
      const fetchedLogs = await newState.guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.MemberMove,
      });
      const moveLog = fetchedLogs.entries.first();

      if (moveLog && Date.now() - moveLog.createdTimestamp < 4000) {
        const executor = await newState.guild.members.fetch(moveLog.executorId).catch(() => null);
        if (isMod(executor)) {
          context.exemptVoiceUsers.add(member.id);
          return;
        }
      }
    } catch (err) {
      console.error('Audit log fetch error:', err.message);
    }

    if (context.exemptVoiceUsers.has(member.id)) return;

    try {
      const valliVC = newState.guild.channels.cache.get(guildData.voiceChannelId);
      if (valliVC) {
        await newState.setChannel(valliVC);
      }
    } catch (err) {
      console.error(`Could not drag ${member.user.tag} to Valli VC:`, err.message);
    }
  },
};