/**
 * Generate PWA icons and OG image from the logo SVG.
 * Run: node scripts/generate-icons.js
 *
 * Since we don't want heavy image processing dependencies,
 * this creates simple SVG-based fallbacks. For production,
 * replace with properly rasterised PNGs.
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Simple colored square icon as SVG (will be served as-is for browsers that support SVG favicons)
function createIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#E7F8FF"/>
      <stop offset="1" stop-color="#FFF3D8"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" stroke="#D8C9EE" stroke-width="${Math.round(size * 0.025)}" fill="none"/>
  <text x="${size / 2}" y="${size * 0.62}" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="${Math.round(size * 0.35)}" fill="#6f62a4">P</text>
</svg>`;
}

// OG Image (1200x630)
function createOGImage() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ogbg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f7f2ff"/>
      <stop offset="1" stop-color="#f7ffe8"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#ogbg)"/>
  <text x="600" y="260" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="800" font-size="72" fill="#6f62a4">Playwise</text>
  <text x="600" y="340" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="600" font-size="32" fill="#24303b">Calm Online Kids Games for Ages 3+</text>
  <text x="600" y="400" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="500" font-size="24" fill="#888">No ads \u2022 No tracking \u2022 Just learning through play</text>
</svg>`;
}

// Write files
fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), createIconSVG(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), createIconSVG(512));
fs.writeFileSync(path.join(publicDir, 'og-image.svg'), createOGImage());

console.log('Generated: icon-192.svg, icon-512.svg, og-image.svg');
console.log('Note: For production, convert these to PNG using an image editor or sharp.');
