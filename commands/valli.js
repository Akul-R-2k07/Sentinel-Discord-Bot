const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ComponentType,
} = require('discord.js');
const { getConfig, saveConfig } = require('../utils/storage');
const { isMod } = require('../utils/helpers');

module.exports = {
  name: 'valli',
  async execute(interaction, context) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: '❌ Only Administrators can toggle Valli mode.',
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const config = getConfig();
    if (!config[interaction.guild.id]) config[interaction.guild.id] = {};

    if (subcommand === 'on') {
      if (config[interaction.guild.id]?.valli?.active) {
        return interaction.reply({ content: '⚠️ Valli mode is already **ON**.', ephemeral: true });
      }

      // Confirmation Dialogue
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('valli_confirm')
          .setLabel('Confirm Lockdown')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('valli_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      const prompt = await interaction.reply({
        content: '⚠️ **Are you sure you want to enable Valli lockdown mode?** This will hide existing channels and restrict users.',
        components: [row],
        ephemeral: true,
        fetchReply: true,
      });

      const confirmation = await prompt
        .awaitMessageComponent({
          filter: (i) => i.user.id === interaction.user.id,
          componentType: ComponentType.Button,
          time: 30000,
        })
        .catch(() => null);

      if (!confirmation || confirmation.customId === 'valli_cancel') {
        return interaction.editReply({
          content: '❌ Lockdown activation cancelled.',
          components: [],
        });
      }

      await confirmation.update({
        content: '⏳ Initializing Valli lockdown mode...',
        components: [],
      });

      const valliRole = await interaction.guild.roles.create({
        name: 'valli',
        color: '#FFFFFF',
        reason: 'Valli lockdown mode enabled',
      });

      const botMember = interaction.guild.members.me;
      const welcomeRoleId = config[interaction.guild.id]?.welcomeRoleId;
      const welcomeRole = welcomeRoleId ? interaction.guild.roles.cache.get(welcomeRoleId) : null;

      try {
        if (welcomeRole) {
          const targetPosition = Math.min(welcomeRole.position + 1, botMember.roles.highest.position - 1);
          await valliRole.setPosition(targetPosition);
        } else {
          const targetPosition = Math.max(1, botMember.roles.highest.position - 1);
          await valliRole.setPosition(targetPosition);
        }
      } catch (posErr) {
        console.warn('Could not reorder role position:', posErr.message);
      }

      const valliCategory = await interaction.guild.channels.create({
        name: 'valli',
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: valliRole.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
            ],
          },
        ],
      });

      const valliText = await interaction.guild.channels.create({
        name: 'valli',
        type: ChannelType.GuildText,
        parent: valliCategory.id,
      });

      const valliVoice = await interaction.guild.channels.create({
        name: 'valli',
        type: ChannelType.GuildVoice,
        parent: valliCategory.id,
      });

      const allChannels = interaction.guild.channels.cache.filter(
        (c) => c.id !== valliCategory.id && c.id !== valliText.id && c.id !== valliVoice.id
      );

      for (const [, channel] of allChannels) {
        if (channel.type === ChannelType.GuildCategory || !channel.parentId) {
          await channel.permissionOverwrites
            .create(valliRole, { ViewChannel: false })
            .catch(() => {});
        }
      }

      const voiceMembers = interaction.guild.members.cache.filter((m) => m.voice.channelId);
      for (const [, member] of voiceMembers) {
        await member.voice.setChannel(valliVoice).catch(() => {});
        if (!isMod(member)) {
          await member.roles.add(valliRole).catch(() => {});
        }
      }

      config[interaction.guild.id].valli = {
        active: true,
        roleId: valliRole.id,
        categoryId: valliCategory.id,
        textChannelId: valliText.id,
        voiceChannelId: valliVoice.id,
      };
      saveConfig();

      return interaction.editReply({
        content: '🚨 **Valli mode is now ON!** Server lockdown initiated.',
        components: [],
      });
    }

    if (subcommand === 'off') {
      await interaction.deferReply();
      const valliData = config[interaction.guild.id]?.valli;
      if (!valliData || !valliData.active) {
        return interaction.editReply('⚠️ Valli mode is currently **OFF**.');
      }

      const textCh = interaction.guild.channels.cache.get(valliData.textChannelId);
      if (textCh) await textCh.delete().catch(() => {});

      const voiceCh = interaction.guild.channels.cache.get(valliData.voiceChannelId);
      if (voiceCh) await voiceCh.delete().catch(() => {});

      const category = interaction.guild.channels.cache.get(valliData.categoryId);
      if (category) await category.delete().catch(() => {});

      const role = interaction.guild.roles.cache.get(valliData.roleId);
      if (role) await role.delete().catch(() => {});

      config[interaction.guild.id].valli = { active: false };
      saveConfig();

      if (context?.exemptVoiceUsers) {
        context.exemptVoiceUsers.clear();
      }

      return interaction.editReply('✅ **Valli mode is now OFF.** All channels and roles restored to normal.');
    }
  },
};