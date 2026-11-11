// Compares two folders of shots (scripts/shots.mjs): prints the share of differing pixels per shot and writes a
// diff image next to each changed shot in the second folder (diff-<name>.png).
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const [a, b] = process.argv.slice(2);
if (!a || !b) throw new Error('usage: node scripts/shots-diff.mjs <before-dir> <after-dir>');
let changed = 0;
for (const f of readdirSync(a).filter((f) => f.endsWith('.png') && !f.startsWith('diff-')).sort()) {
	if (!existsSync(`${b}/${f}`)) {
		console.log(`${f.padEnd(32)} missing in ${b}`);
		continue;
	}
	const x = PNG.sync.read(readFileSync(`${a}/${f}`));
	const y = PNG.sync.read(readFileSync(`${b}/${f}`));
	if (x.width !== y.width || x.height !== y.height) {
		console.log(`${f.padEnd(32)} size ${x.width}×${x.height} → ${y.width}×${y.height}`);
		changed++;
		continue;
	}
	const diff = new PNG({ width: x.width, height: x.height });
	const n = pixelmatch(x.data, y.data, diff.data, x.width, x.height, { threshold: 0.1 });
	const share = (100 * n) / (x.width * x.height);
	if (n) {
		changed++;
		writeFileSync(`${b}/diff-${f}`, PNG.sync.write(diff));
	}
	console.log(`${f.padEnd(32)} ${n ? share.toFixed(2) + ' %' : 'same'}`);
}
console.log(changed ? `${changed} changed` : 'all the same');
