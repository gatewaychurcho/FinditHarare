const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const squareSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0066FF" />
      <stop offset="100%" stop-color="#0047BA" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <circle cx="380" cy="130" r="32" fill="#38BDF8" opacity="0.95" />
  <g transform="translate(112, 108)">
    <path d="M 120 40 C 120 18 138 0 160 0 C 205 0 240 35 240 80 L 240 100 L 270 100 C 283 100 294 111 294 124 C 294 137 283 148 270 148 L 240 148 L 240 270 C 240 283 229 294 216 294 C 203 294 192 283 192 270 L 192 148 L 140 148 C 127 148 116 137 116 124 C 116 111 127 100 140 100 L 192 100 L 192 80 C 192 62 178 48 160 48 C 145 48 135 56 128 66 L 120 40 Z" fill="#FFFFFF" />
    <path d="M 60 170 L 130 115 L 130 225 Z" fill="#FFFFFF" opacity="0.95" />
    <circle cx="95" cy="170" r="16" fill="#0066FF" stroke="#FFFFFF" stroke-width="6" />
  </g>
</svg>`;

const roundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradR" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0066FF" />
      <stop offset="100%" stop-color="#0047BA" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="256" fill="url(#bgGradR)" />
  <circle cx="366" cy="144" r="30" fill="#38BDF8" opacity="0.95" />
  <g transform="translate(112, 108)">
    <path d="M 120 40 C 120 18 138 0 160 0 C 205 0 240 35 240 80 L 240 100 L 270 100 C 283 100 294 111 294 124 C 294 137 283 148 270 148 L 240 148 L 240 270 C 240 283 229 294 216 294 C 203 294 192 283 192 270 L 192 148 L 140 148 C 127 148 116 137 116 124 C 116 111 127 100 140 100 L 192 100 L 192 80 C 192 62 178 48 160 48 C 145 48 135 56 128 66 L 120 40 Z" fill="#FFFFFF" />
    <path d="M 60 170 L 130 115 L 130 225 Z" fill="#FFFFFF" opacity="0.95" />
    <circle cx="95" cy="170" r="16" fill="#0066FF" stroke="#FFFFFF" stroke-width="6" />
  </g>
</svg>`;

const tmpDir = '/tmp/fh_icons';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

fs.writeFileSync(path.join(tmpDir, 'square.svg'), squareSvg);
fs.writeFileSync(path.join(tmpDir, 'round.svg'), roundSvg);

execSync(`qlmanage -t -s 512 -o "${tmpDir}" "${path.join(tmpDir, 'square.svg')}"`);
execSync(`qlmanage -t -s 512 -o "${tmpDir}" "${path.join(tmpDir, 'round.svg')}"`);

const masterSquarePng = path.join(tmpDir, 'square.svg.png');
const masterRoundPng = path.join(tmpDir, 'round.svg.png');

const androidRes = path.resolve(__dirname, '../android/app/src/main/res');
const densities = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

densities.forEach(({ dir, size }) => {
  const targetDir = path.join(androidRes, dir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const squareDst = path.join(targetDir, 'ic_launcher.png');
  const roundDst = path.join(targetDir, 'ic_launcher_round.png');

  execSync(`sips -z ${size} ${size} "${masterSquarePng}" --out "${squareDst}"`);
  execSync(`sips -z ${size} ${size} "${masterRoundPng}" --out "${roundDst}"`);
  console.log(`Generated ${dir} icons (${size}x${size})`);
});

// Also update web icons
const pubIcons = path.resolve(__dirname, '../public/icons');
execSync(`sips -z 512 512 "${masterSquarePng}" --out "${path.join(pubIcons, 'icon-512.png')}"`);
execSync(`sips -z 192 192 "${masterSquarePng}" --out "${path.join(pubIcons, 'icon-192.png')}"`);
execSync(`sips -z 180 180 "${masterSquarePng}" --out "${path.join(pubIcons, 'apple-touch-icon.png')}"`);

const pubAssets = path.resolve(__dirname, '../public/assets');
execSync(`sips -z 192 192 "${masterSquarePng}" --out "${path.join(pubAssets, 'app-icon.png')}"`);
execSync(`sips -z 192 192 "${masterSquarePng}" --out "${path.join(pubAssets, 'app-icon-v2.png')}"`);
execSync(`sips -z 192 192 "${masterRoundPng}" --out "${path.join(pubAssets, 'support-icon.png')}"`);

console.log('All icons generated successfully!');
