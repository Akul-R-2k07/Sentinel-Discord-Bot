const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

const CONFIG_PATH = path.join(__dirname, '..', 'bot-config.json');
const GIF_PATH = path.join(__dirname, '..', 'assets', 'welcome.gif');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    if (!fs.existsSync(CONFIG_PATH)) return;

    let config;
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
      return;
    }

    const guildConfig = config[member.guild.id];
    if (!guildConfig) return;

    // 1. Assign welcome role if configured
    if (guildConfig.welcomeRoleId) {
      const welcomeRole = member.guild.roles.cache.get(guildConfig.welcomeRoleId);
      if (welcomeRole) {
        await member.roles.add(welcomeRole).catch(() => {});
      }
    }

    // 2. Check if welcome announcements are enabled
    const welcome = guildConfig.welcome;
    if (!welcome || !welcome.enabled || !welcome.channelId) return;

    const channel = member.guild.channels.cache.get(welcome.channelId);
    if (!channel) return;

    // Channel placeholders
    const rulesText = welcome.rulesChannelId ? `<#${welcome.rulesChannelId}>` : 'rules';
    const selfRoleText = welcome.selfRoleChannelId ? `<#${welcome.selfRoleChannelId}>` : 'self-roles';

    // Member display name with @ prefix (e.g. @kannan)
    const displayName = `@${member.displayName}`;

    // 3. Construct the Welcome Embed
    const embed = new EmbedBuilder()
      .setColor(0xe50000) // Deep red border
      .setDescription(
        [
          `Hey **${displayName}**`,
          `Welcome To **${member.guild.name}** 🔥`,
          '',
          `**Read Server Rules** { ${rulesText} }`,
          '',
          `**Self-Role** { ${selfRoleText} }`,
          '',
          `thanks for joining`,
          `**${displayName}**`,
        ].join('\n')
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({
        text: `Member #${member.guild.memberCount} • ${member.guild.name}`,
        iconURL: member.guild.iconURL({ dynamic: true }),
      })
      .setTimestamp();

    // 4. Attach animated GIF if present
    const files = [];
    if (fs.existsSync(GIF_PATH)) {
      const attachment = new AttachmentBuilder(GIF_PATH, { name: 'welcome.gif' });
      files.push(attachment);
      embed.setImage('attachment://welcome.gif');
    }

    await channel.send({ embeds: [embed], files }).catch(console.error);
  },
};