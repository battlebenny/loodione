// Colorise les icônes design monochromes en SVGs modules prêts pour le shell.
// Usage: node colorize-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DESIGN_ICONS = '/Users/bgermain/Sites/github/Loodi-apps/design/assets/icons';
const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const OUT = join(PUBLIC, 'icons');
const PAGES_OUT = join(dirname(fileURLToPath(import.meta.url)), '../../../public/icons');

const NAVY = '#1b2a4a';
const YELLOW = '#F5C842';
const RIGHT_FACE = 'matrix(0.429 -0.216 0 0.48 60.6 61.3)';

const MODULES = [
  { outputSlug: 'loodi', icon: 'collec.svg', color: '#ca4a16' },
  { outputSlug: 'loodi-mate', icon: 'mate.svg', color: '#2E8B57' },
  { outputSlug: 'loodi-mag', icon: 'mag.svg', color: '#3570A8' },
  { outputSlug: 'loodi-places', icon: 'places.svg', color: '#9B59B6' },
  { outputSlug: 'loodi-fest', icon: 'fest.svg', color: '#E67E22' },
  { outputSlug: 'loodi-planner', icon: 'sessions.svg', color: '#007C91' },
  { outputSlug: 'loodi-friends', icon: 'friends.svg', color: '#D84A77' },
];

function colorize(svg, bodyColor, rightFaceColor) {
  return svg
    .replaceAll('stroke="currentColor"', `stroke="${bodyColor}"`)
    .replaceAll('fill="currentColor"', `fill="${bodyColor}"`)
    .replaceAll(`${RIGHT_FACE}" fill="${bodyColor}"`, `${RIGHT_FACE}" fill="${rightFaceColor}"`);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(PAGES_OUT, { recursive: true });
for (const { outputSlug, icon, color } of MODULES) {
  const src = readFileSync(join(DESIGN_ICONS, icon), 'utf8');
  const light = colorize(src, color, color);
  const dark = colorize(src, color, color);
  for (const destination of [OUT, PAGES_OUT]) {
    writeFileSync(join(destination, `${outputSlug}.svg`), light);
    writeFileSync(join(destination, `${outputSlug}-dark.svg`), dark);
  }
  console.log(`${outputSlug}.svg + ${outputSlug}-dark.svg ← ${icon} (face droite ${color})`);
}

const die = readFileSync(join(DESIGN_ICONS, 'loodi.svg'), 'utf8');
const dieLight = colorize(die, NAVY, NAVY).replaceAll('#FFFFFF', YELLOW);
const dieDark = colorize(die, '#ca4a16', '#ca4a16').replaceAll('#FFFFFF', YELLOW);
writeFileSync(join(PUBLIC, 'logo.svg'), dieLight);
writeFileSync(join(PUBLIC, 'logo-dark.svg'), dieDark);
console.log('logo.svg (navy + rond jaune) + logo-dark.svg (orange + rond jaune)');
