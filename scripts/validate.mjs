import { readFile, readdir, access } from 'node:fs/promises';

const fail = (message) => { console.error(`VALIDATION FAILED: ${message}`); process.exitCode = 1; };
const ok = (message) => console.log(`OK: ${message}`);

const [game, html, css] = await Promise.all([
  readFile('game.js', 'utf8'),
  readFile('index.html', 'utf8'),
  readFile('styles.css', 'utf8')
]);

if (game.length < 30000) fail(`game.js looks truncated (${game.length} bytes)`); else ok(`game.js size ${game.length} bytes`);
if (!game.includes('function loop()') && !game.includes('function loop(){')) fail('main render loop not found'); else ok('main render loop present');
if (!game.includes('renderer.render(scene,camera)')) fail('renderer call not found'); else ok('renderer call present');
if (!game.includes('showFatal')) fail('startup failure guard not found'); else ok('startup guard present');

const forbidden = [
  /fetch\s*\(\s*['\"]\.\/?beta/i,
  /source\.replace\s*\(/,
  /new\s+Blob\s*\(/,
  /import\s*\(\s*URL\.createObjectURL/i
];
for (const pattern of forbidden) {
  if (pattern.test(game)) fail(`forbidden runtime patching pattern found: ${pattern}`);
}

if (!/src=["']\.\/game\.js\?v=\d+["']/.test(html)) fail('index.html must load only ./game.js?v=NNN'); else ok('index points to game.js');
if (/beta\d+\.js/i.test(html)) fail('index.html references a legacy beta file');
if (css.length < 4000) fail(`styles.css looks unexpectedly small (${css.length} bytes)`); else ok(`styles.css size ${css.length} bytes`);

const gameVersion = game.match(/const\s+VERSION\s*=\s*['\"](Beta\s+\d+\.\d+\.\d+)['\"]/i)?.[1];
const htmlVersions = [...html.matchAll(/Beta\s+\d+\.\d+\.\d+/gi)].map(m => m[0]);
if (!gameVersion) fail('game version constant not found');
else if (!htmlVersions.length || htmlVersions.some(v => v.toLowerCase() !== gameVersion.toLowerCase())) fail(`version mismatch: game=${gameVersion}, html=${htmlVersions.join(', ')}`);
else ok(`version consistent: ${gameVersion}`);

const root = await readdir('.');
const legacyInRoot = root.filter(name => /^beta\d+.*\.js$/i.test(name) || /^styles\d+\.css$/i.test(name));
if (legacyInRoot.length) fail(`legacy build files must stay under legacy/: ${legacyInRoot.join(', ')}`); else ok('root contains no legacy build files');

for (const asset of ['assets/vehicles/Bu.glb','assets/vehicles/police_car_simple.glb','assets/vehicles/tow_truck_simple.glb']) {
  try { await access(asset); ok(`${asset} present`); } catch { fail(`${asset} missing`); }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('Repository validation passed.');
