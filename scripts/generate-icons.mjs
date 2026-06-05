// Genereert PWA-app-iconen (PNG) uit een SVG vinyl-disc in de "Warm Hi-Fi" stijl.
// Eenmalig draaien met: npm install --no-save sharp && node scripts/generate-icons.mjs
//
// Ontwerp: een DONKERE plaat op een WARM amber/terracotta veld met een licht label.
// Hoog contrast → goed zichtbaar op een donker (of licht) beginscherm. Full-bleed
// (geen transparante hoeken) zodat iOS de afronding zelf doet en er geen zwarte
// hoeken ontstaan.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0c179"/>
      <stop offset="46%" stop-color="#d99a4e"/>
      <stop offset="100%" stop-color="#b1472f"/>
    </linearGradient>
    <radialGradient id="label" cx="40%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#fbf3e3"/>
      <stop offset="60%" stop-color="#f0d9b0"/>
      <stop offset="100%" stop-color="#d9a05b"/>
    </radialGradient>
    <radialGradient id="sheen" cx="34%" cy="28%" r="80%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="42%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- warm veld (full-bleed) -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <g transform="translate(256 256)">
    <!-- vinyl: donker op warm veld = hoog contrast -->
    <circle r="172" fill="#15110e"/>
    <circle r="172" fill="none" stroke="#000000" stroke-opacity="0.35" stroke-width="3"/>
    <!-- groeven -->
    <g fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="2.5">
      <circle r="152"/><circle r="134"/><circle r="116"/><circle r="98"/>
    </g>
    <!-- licht label -->
    <circle r="62" fill="url(#label)"/>
    <circle r="62" fill="none" stroke="#a9763a" stroke-opacity="0.5" stroke-width="2"/>
    <circle r="36" fill="none" stroke="#a9763a" stroke-opacity="0.35" stroke-width="2"/>
    <!-- center hole -->
    <circle r="8" fill="#15110e"/>
    <!-- glans -->
    <circle r="172" fill="url(#sheen)"/>
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
  // flatten op een ondoorzichtige achtergrond (geen alpha) — belangrijk voor iOS
  await sharp(buf).resize(size, size).flatten({ background: '#d99a4e' }).png().toFile(file);
  console.log('geschreven:', file);
}
console.log('klaar.');
