const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const BG_PATH = path.join(__dirname, '..', 'assets', 'wasted.png');

/**
 * Generates a dynamic "Wasted" goodbye image card.
 * @param {import('discord.js').GuildMember} member
 * @returns {Promise<Buffer>}
 */
async function generateGoodbyeCard(member) {
  // 1. Create canvas matching the background image dimensions (or default 1280x720)
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

  // 2. Draw Background
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, width, height);
  } else {
    // Dark fallback if image not found
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Dimensions & Center calculations
  const centerX = width / 2;
  const avatarRadius = Math.round(height * 0.18); // Dynamic proportional radius
  const avatarCenterY = Math.round(height * 0.42); // Centered above the text area

  // 4. Fetch & Draw Circular Profile Picture
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

    // Red outline ring around profile picture
    ctx.beginPath();
    ctx.arc(centerX, avatarCenterY, avatarRadius, 0, Math.PI * 2, true);
    ctx.strokeStyle = '#e50000';
    ctx.lineWidth = Math.max(6, Math.round(avatarRadius * 0.06));
    ctx.shadowColor = 'rgba(229, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.stroke();
  } catch (err) {
    console.error('Failed to load user avatar for goodbye card:', err);
  }

  // 5. Draw Display Name below avatar
  const displayName = `@${member.displayName || member.user.username}`;
  const fontSize = Math.max(28, Math.round(height * 0.06));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Text Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // Text Stroke and Fill
  const textY = avatarCenterY + avatarRadius + 20;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayName, centerX, textY);

  return canvas.toBuffer('image/png');
}

module.exports = { generateGoodbyeCard };