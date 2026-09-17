require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  console.error('❌ Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in .env file.');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check the bot response time and websocket latency'),
  new SlashCommandBuilder().setName('help').setDescription('Display available commands based on your permissions').setDMPermission(false),
  new SlashCommandBuilder().setName('my').setDescription('View personal stats and info').setDMPermission(false)
    .addSubcommand((sub) => sub.setName('level').setDescription('Check your current level and XP progress')),
  new SlashCommandBuilder().setName('user').setDescription('View stats and info of another member').setDMPermission(false)
    .addSubcommand((sub) => sub.setName('level').setDescription('Check another member’s level and XP progress')
      .addUserOption((option) => option.setName('target').setDescription('Select the member to view').setRequired(true))),
  new SlashCommandBuilder().setName('userinfo').setDescription('Detailed member breakdown: leveling, message & voice activity over 1d, 7d, and 14d').setDMPermission(false)
    .addUserOption((option) => option.setName('target').setDescription('Target member to inspect (defaults to you)')),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Server-wide aggregate metrics, top channels, and engagement statistics').setDMPermission(false),
  new SlashCommandBuilder().setName('leaderboard').setDescription('Display top members ranked by their level and XP').setDMPermission(false),
  new SlashCommandBuilder().setName('valli').setDescription('Control the Valli lockdown mode').setDefaultMemberPermissions(PermissionFlagsBits.Administrator).setDMPermission(false)
    .addSubcommand((sub) => sub.setName('on').setDescription('Enable Valli lockdown mode'))
    .addSubcommand((sub) => sub.setName('off').setDescription('Disable Valli lockdown mode and restore server')),
  new SlashCommandBuilder().setName('welcome').setDescription('Server welcome system settings').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).setDMPermission(false)
    .addSubcommand((sub) => sub.setName('role').setDescription('Configure the automatic role assigned when a member joins')
      .addRoleOption((option) => option.setName('role').setDescription('Select the role to give to new members').setRequired(true))),
  new SlashCommandBuilder().setName('purge').setDescription('Bulk moderation message deletion tools').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).setDMPermission(false)
    .addSubcommand((sub) => sub.setName('user').setDescription("Delete a user's messages across all channels or a specific channel")
      .addUserOption((option) => option.setName('target').setDescription('Select the server member').setRequired(true))
      .addIntegerOption((option) => option.setName('amount').setDescription('Messages to scan/delete per channel (1-100)').setMinValue(1).setMaxValue(100))
      .addChannelOption((option) => option.setName('channel').setDescription('Specific channel (leave blank for all channels)').addChannelTypes(ChannelType.GuildText))
      .addIntegerOption((option) => option.setName('hours_ago').setDescription('Only delete messages within X hours').setMinValue(1)))
    .addSubcommand((sub) => sub.setName('channel').setDescription('Purge messages in a specific channel')
      .addChannelOption((option) => option.setName('target_channel').setDescription('Channel to purge').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addIntegerOption((option) => option.setName('amount').setDescription('Number of messages to delete (1-100)').setMinValue(1).setMaxValue(100))
      .addIntegerOption((option) => option.setName('hours_ago').setDescription('Only delete messages within X hours').setMinValue(1)))
    .addSubcommand((sub) => sub.setName('all').setDescription('Purge recent messages across ALL text channels in the server')
      .addIntegerOption((option) => option.setName('amount').setDescription('Number of messages to delete per channel (1-100)').setMinValue(1).setMaxValue(100))
      .addIntegerOption((option) => option.setName('hours_ago').setDescription('Only delete messages within X hours').setMinValue(1))),
  new SlashCommandBuilder().setName('auto').setDescription('Automated user preferences').setDMPermission(false)
    .addSubcommand((sub) => sub.setName('react').setDescription('React with an emoji whenever someone mentions you')
      .addStringOption((option) => option.setName('emoji').setDescription('Emoji, custom emoji ID, or type "off" to remove').setRequired(true)))
    .addSubcommand((sub) => sub.setName('respond').setDescription('Set an automated reply message when someone mentions you')),
  new SlashCommandBuilder().setName('move').setDescription('Mass voice channel relocation tools').setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers).setDMPermission(false)
    .addSubcommand((sub) => sub.setName('all').setDescription('Move members in voice channels to a destination channel')
      .addChannelOption((option) => option.setName('target').setDescription('Destination voice channel').addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice).setRequired(true))
      .addChannelOption((option) => option.setName('from').setDescription('Source voice channel (leave blank to move everyone across all VCs)').addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice).setRequired(false))),
  new SlashCommandBuilder().setName('mute').setDescription('Voice channel moderation tools').setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers).setDMPermission(false)
    .addSubcommand((sub) => sub.setName('all').setDescription('Server mute all members in your current voice channel'))
    .addSubcommand((sub) => sub.setName('users').setDescription('Server mute members in your current VC by role, name, or guild tag')
      .addRoleOption((option) => option.setName('role').setDescription('Mute members who have this role'))
      .addStringOption((option) => option.setName('name_contains').setDescription('Mute members whose display name contains this text/keyword'))
      .addStringOption((option) => option.setName('guild_tag').setDescription('Mute by server/clan tag (enter specific tag like CGC, or type "any")'))),
  new SlashCommandBuilder().setName('unmute').setDescription('Voice channel moderation tools').setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers).setDMPermission(false)
    .addSubcommand((sub) => sub.setName('all').setDescription('Server unmute all members in your current voice channel')),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`⏳ Registering commands to Guild: ${process.env.GUILD_ID}...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Successfully registered all slash commands!');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
})();