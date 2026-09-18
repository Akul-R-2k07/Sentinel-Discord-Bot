const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const BG_PATH = path.join(__dirname, '..', 'assets', 'wasted.png');

/**
 * Generates a dynamic "Wasted" goodbye image card.
 * Avatar at top, large display name directly below the avatar.
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<Buffer>}
 */
async function generateGoodbyeCard(member) {
  let bgImg;
  let width = 1280;
  let height = 720;

  if (fs.existsSync(BG_PATH)) {
    bgImg = await loadImage(BG_PATH);
    width = bgImg.width;
    height = bgImg.height;
  }

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 1. Draw Background
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, width, height);
  } else {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
  }

  const centerX = width / 2;

  // 2. Profile Picture: Positioned in the upper portion
  const avatarRadius = Math.round(height * 0.15);
  const avatarCenterY = Math.round(height * 0.22);

  const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 });
  try {
    const avatarImg = await loadImage(avatarURL);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, avatarCenterY, avatarRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(
      avatarImg,
      centerX - avatarRadius,
      avatarCenterY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );
    ctx.restore();

    // Red glowing outline ring
    ctx.beginPath();
    ctx.arc(centerX, avatarCenterY, avatarRadius, 0, Math.PI * 2, true);
    ctx.strokeStyle = '#e50000';
    ctx.lineWidth = Math.max(5, Math.round(avatarRadius * 0.05));
    ctx.shadowColor = 'rgba(229, 0, 0, 0.9)';
    ctx.shadowBlur = 18;
    ctx.stroke();
  } catch (err) {
    console.error('Failed to load user avatar for goodbye card:', err);
  }

  // 3. Display Name: Positioned directly below the avatar (like before), keeping the large size
  const displayName = `@${member.displayName || member.user.username}`;

  // Keep the large ~3x size
  let fontSize = Math.round(height * 0.14);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Prevent text from overflowing if the name is unusually long
  while (ctx.measureText(displayName).width > width * 0.92 && fontSize > 28) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px sans-serif`;
  }

  // Placed directly underneath the avatar
  const textY = Math.round(height * 0.68);

  // Text Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayName, centerX, textY);

  return canvas.toBuffer('image/png');
}

module.exports = { generateGoodbyeCard };