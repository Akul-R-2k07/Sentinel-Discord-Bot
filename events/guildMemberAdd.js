const { PermissionFlagsBits } = require('discord.js');
const { getConfig } = require('../utils/storage');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const config = getConfig();
    const welcomeRoleId = config[member.guild.id]?.welcomeRoleId;
    if (!welcomeRoleId) return;

    const role = member.guild.roles.cache.get(welcomeRoleId);
    if (!role) return;

    const botMember = member.guild.members.me;
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) return;
    if (botMember.roles.highest.position <= role.position) return;

    try {
      await member.roles.add(role);
    } catch (err) {
      console.error(`[WelcomeRole] Error assigning role to ${member.user.tag}:`, err.message);
    }
  },
};