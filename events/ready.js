const { addXP, logVoiceActivity } = require('../utils/helpers');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`🤖 Bot is online as ${client.user.tag}`);

    // Voice Activity & XP Ticker (runs every 60s, updates memory cache)
    setInterval(() => {
      for (const [, guild] of client.guilds.cache) {
        const voiceStates = guild.voiceStates.cache;

        for (const [, state] of voiceStates) {
          const member = state.member;
          if (!member || member.user.bot) continue;
          if (state.deaf || state.mute || state.channelId === guild.afkChannelId) continue;

          const channel = state.channel;
          if (!channel) continue;
          const activeMembers = channel.members.filter((m) => !m.user.bot);
          if (activeMembers.size < 2) continue;

          const voiceXpGain = Math.floor(Math.random() * 11) + 15;
          addXP(guild.id, member.id, voiceXpGain);
          logVoiceActivity(guild.id, member.id, channel.id, 1);
        }
      }
    }, 60 * 1000);
  },
};