const fs = require('fs');
const path = require('path');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

const CONFIG_PATH = path.join(__dirname, '..', 'bot-config.json');
const GIF_PATH = path.join(__dirname, '..', 'assets', 'welcome.gif');

function getConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  name: 'welcome',
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    const config = getConfig();
    if (!config[guildId]) config[guildId] = {};
    if (!config[guildId].welcome) config[guildId].welcome = {};

    // 1. /welcome on <channel>
    if (subcommand === 'on') {
      const channel = interaction.options.getChannel('channel');
      config[guildId].welcome.enabled = true;
      config[guildId].welcome.channelId = channel.id;
      saveConfig(config);

      const rulesId = config[guildId].welcome.rulesChannelId;
      const selfRoleId = config[guildId].welcome.selfRoleChannelId;

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('✅ Welcome System Activated')
        .setDescription(`Welcome cards will now be sent to ${channel}.`)
        .setTimestamp();

      const missingWarnings = [];
      if (!rulesId) missingWarnings.push('• **Rules Channel** is not set (`/welcome rules`)');
      if (!selfRoleId) missingWarnings.push('• **Self-Role Channel** is not set (`/welcome selfrole`)');

      if (missingWarnings.length > 0) {
        embed.addFields({
          name: '⚠️ Pending Setup Notice',
          value: `To complete the welcome embed, configure the following:\n${missingWarnings.join('\n')}`,
        });
      }

      return interaction.reply({ embeds: [embed] });
    }

    // 2. /welcome off
    if (subcommand === 'off') {
      config[guildId].welcome.enabled = false;
      saveConfig(config);

      return interaction.reply({
        content: '🛑 Welcome system has been disabled.',
      });
    }

    // 3. /welcome rules <channel>
    if (subcommand === 'rules') {
      const channel = interaction.options.getChannel('channel');
      config[guildId].welcome.rulesChannelId = channel.id;
      saveConfig(config);

      return interaction.reply({
        content: `📖 Rules channel set to ${channel}.`,
      });
    }

    // 4. /welcome selfrole <channel>
    if (subcommand === 'selfrole') {
      const channel = interaction.options.getChannel('channel');
      config[guildId].welcome.selfRoleChannelId = channel.id;
      saveConfig(config);

      return interaction.reply({
        content: `🎭 Self-Role channel set to ${channel}.`,
      });
    }

    // 5. /welcome role <role>
    if (subcommand === 'role') {
      const role = interaction.options.getRole('role');
      config[guildId].welcomeRoleId = role.id;
      saveConfig(config);

      return interaction.reply({
        content: `🎖️ Automatic newcomer role set to **@${role.name}**.`,
      });
    }

    // 6. /welcome test (Preview the welcome card immediately)
    if (subcommand === 'test') {
      await interaction.deferReply();

      const member = interaction.member;
      const welcome = config[guildId].welcome || {};

      const rulesText = welcome.rulesChannelId ? `<#${welcome.rulesChannelId}>` : 'rules';
      const selfRoleText = welcome.selfRoleChannelId ? `<#${welcome.selfRoleChannelId}>` : 'self-roles';
      const displayName = `@${member.displayName}`;

      const embed = new EmbedBuilder()
        .setColor(0xe50000)
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

      const files = [];
      if (fs.existsSync(GIF_PATH)) {
        const attachment = new AttachmentBuilder(GIF_PATH, { name: 'welcome.gif' });
        files.push(attachment);
        embed.setImage('attachment://welcome.gif');
      }

      return interaction.editReply({ embeds: [embed], files });
    }
  },
};