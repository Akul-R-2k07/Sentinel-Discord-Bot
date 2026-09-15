const { PermissionFlagsBits } = require('discord.js');

async function purgeFromChannel(channel, { amount, hoursAgo }) {
  const botPermissions = channel.permissionsFor(channel.client.user);
  if (
    !botPermissions ||
    !botPermissions.has(PermissionFlagsBits.ViewChannel) ||
    !botPermissions.has(PermissionFlagsBits.ReadMessageHistory) ||
    !botPermissions.has(PermissionFlagsBits.ManageMessages)
  ) {
    return 0;
  }

  try {
    const fetchedMessages = await channel.messages.fetch({ limit: 100 });
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    let cutoff = fourteenDaysAgo;

    if (hoursAgo) {
      cutoff = Math.max(fourteenDaysAgo, Date.now() - hoursAgo * 60 * 60 * 1000);
    }

    let messagesToDelete = fetchedMessages.filter((msg) => msg.createdTimestamp > cutoff);

    if (messagesToDelete.size === 0) return 0;
    if (messagesToDelete.size > amount) {
      messagesToDelete = messagesToDelete.first(amount);
    }

    const deleted = await channel.bulkDelete(messagesToDelete, true);
    return deleted.size;
  } catch (error) {
    console.error(`Failed to purge in ${channel.name}:`, error.message);
    return 0;
  }
}

// Paginated scan for user messages beyond the top 100 messages
async function purgeUserFromChannel(channel, { amount, hoursAgo, targetUser }) {
  const botPermissions = channel.permissionsFor(channel.client.user);
  if (
    !botPermissions ||
    !botPermissions.has(PermissionFlagsBits.ViewChannel) ||
    !botPermissions.has(PermissionFlagsBits.ReadMessageHistory) ||
    !botPermissions.has(PermissionFlagsBits.ManageMessages)
  ) {
    return 0;
  }

  const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
  let cutoff = fourteenDaysAgo;
  if (hoursAgo) {
    cutoff = Math.max(fourteenDaysAgo, Date.now() - hoursAgo * 60 * 60 * 1000);
  }

  const messagesToDelete = [];
  let lastMessageId = null;
  let continueFetching = true;

  while (continueFetching && messagesToDelete.length < amount) {
    const fetchOptions = { limit: 100 };
    if (lastMessageId) fetchOptions.before = lastMessageId;

    let batch;
    try {
      batch = await channel.messages.fetch(fetchOptions);
    } catch {
      break;
    }

    if (!batch || batch.size === 0) break;

    for (const msg of batch.values()) {
      if (msg.createdTimestamp <= cutoff) {
        continueFetching = false;
        break;
      }

      if (msg.author.id === targetUser.id) {
        messagesToDelete.push(msg);
        if (messagesToDelete.length >= amount) {
          continueFetching = false;
          break;
        }
      }
    }

    lastMessageId = batch.last()?.id;
    if (!lastMessageId) break;
  }

  if (messagesToDelete.length === 0) return 0;

  try {
    const deleted = await channel.bulkDelete(messagesToDelete, true);
    return deleted.size;
  } catch (error) {
    console.error(`Failed to bulk delete user messages in ${channel.name}:`, error.message);
    return 0;
  }
}

module.exports = {
  purgeFromChannel,
  purgeUserFromChannel,
};