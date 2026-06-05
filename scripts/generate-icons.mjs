// Genereert PWA-app-iconen (PNG) uit een SVG vinyl-disc in de "Warm Hi-Fi" stijl.
// Eenmalig draaien met: node scripts/generate-icons.mjs
// sharp wordt enkel hiervoor gebruikt (via npm install --no-save sharp).
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="72%" cy="14%" r="90%">
      <stop offset="0%" stop-color="#2a2017"/>
      <stop offset="55%" stop-color="#161210"/>
      <stop offset="100%" stop-color="#100d0b"/>
    </radialGradient>
    <radialGradient id="label" cx="38%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#f0c481"/>
      <stop offset="55%" stop-color="#d9a05b"/>
      <stop offset="100%" stop-color="#b9823f"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="512" height="512" rx="112" fill="url(#bg)"/>

  <g transform="translate(256 256)">
    <!-- vinyl -->
    <circle r="170" fill="#0c0a09"/>
    <circle r="170" fill="none" stroke="#3a2f24" stroke-width="2"/>
    <!-- groeven -->
    <g fill="none" stroke="#d9a05b" stroke-opacity="0.14" stroke-width="2">
      <circle r="152"/><circle r="136"/><circle r="120"/><circle r="104"/><circle r="88"/>
    </g>
    <!-- sheen -->
    <circle r="170" fill="url(#sheen)"/>
    <!-- label -->
    <circle r="66" fill="url(#label)"/>
    <circle r="66" fill="none" stroke="#7a5526" stroke-opacity="0.5" stroke-width="2"/>
    <circle r="40" fill="none" stroke="#7a5526" stroke-opacity="0.35" stroke-width="2"/>
    <!-- center hole -->
    <circle r="9" fill="#161210"/>
  </g>
</svg>`;

const out = 'public/icons';
await mkdir(out, { recursive: true });

const buf = Buffer.from(svg);
const jobs = [
  { file: `${out}/icon-192.png`, size: 192 },
  { file: `${out}/icon-512.png`, size: 512 },
  { file: `${out}/icon-maskable-512.png`, size: 512 },
  { file: `${out}/apple-touch-icon.png`, size: 180 },
];

for (const { file, size } of jobs) {
  await sharp(buf).resize(size, size).png().toFile(file);
  console.log('geschreven:', file);
}
console.log('klaar.');
