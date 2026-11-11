// Screenshots of the editor's looks, light and dark, for checking style changes by eye and by pixel diff.
// Needs the dev server (bun run dev) and a local Chrome. Usage:
//   node scripts/shots.mjs <out-dir> [base-url]       e.g. node scripts/shots.mjs var/shots/before http://localhost:5173
//   node scripts/shots-diff.mjs var/shots/before var/shots/after
// CHROME=/path/to/chrome overrides the browser.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const [out, base = 'http://localhost:5173'] = process.argv.slice(2);
if (!out) throw new Error('usage: node scripts/shots.mjs <out-dir> [base-url]');
mkdirSync(out, { recursive: true });
const executablePath = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Each shot: a page, what to do there, and what to photograph. */
const shots = [
	{ name: 'editor', path: '/dev/states', clip: '[data-shot="editor"]' },
	{ name: 'readonly', path: '/dev/states', clip: '[data-shot="readonly"]' },
	{ name: 'preview', path: '/dev/states', clip: '[data-shot="preview"]' },
	{
		name: 'handle-bubble',
		path: '/dev/states',
		clip: '[data-shot="editor"]',
		act: async (p) => {
			await row(p, 1).hover();
			await row(p, 1).locator('.grip').hover();
			await p.waitForTimeout(400);
		}
	},
	{ name: 'block-selection', path: '/dev/states', clip: '[data-shot="editor"]', act: async (p) => (await row(p, 2).hover(), await row(p, 2).locator('.handle').click(), await p.mouse.move(0, 0)) },
	{
		name: 'slash-menu',
		path: '/dev/states',
		act: async (p) => {
			await editor(p).locator(':scope > .row').last().locator('.ce').click();
			await p.keyboard.type('/');
			await p.waitForTimeout(200);
		}
	},
	{
		name: 'turn-menu',
		path: '/dev/states',
		act: async (p) => {
			await row(p, 1).hover();
			await row(p, 1).locator('.grip').hover();
			await p.waitForTimeout(400);
			await row(p, 1).locator('.bubble button').nth(1).click();
			await p.waitForTimeout(200);
		}
	},
	{ name: 'toolbar', path: '/dev/states', act: async (p) => (await row(p, 1).locator('.ce b').dblclick(), await p.waitForTimeout(200)) },
	{ name: 'link-prompt', path: '/dev/states', act: async (p) => (await row(p, 1).locator('.ce b').dblclick(), await p.keyboard.press('Control+k'), await p.waitForTimeout(300)) },
	{ name: 'fields-button', path: '/dev/states', clip: () => '.editor .row[data-type="plugin"]:has(.bar) >> nth=2', act: (p) => openBar(p, 'button') },
	{ name: 'fields-gap', path: '/dev/states', act: (p) => openBar(p, 'gap') },
	{ name: 'fields-table', path: '/dev/states', act: async (p) => (await openBar(p, 'table'), await editor(p).locator('textarea').nth(3).click()) },
	{ name: 'fields-code', path: '/dev/states', act: (p) => openBar(p, 'code') },
	{ name: 'container', path: '/dev/states', act: (p) => openBar(p, 'note') }
];

const editor = (p) => p.locator('[data-shot="editor"] > .editor');
const row = (p, n) => editor(p).locator(':scope > .row').nth(n);
/** Opens the fields bar of the first block whose tag starts with `tag`, and keeps it in view. */
async function openBar(p, tag) {
	const head = editor(p).locator(':scope > .row .bar > button.head', { hasText: tag }).first();
	await head.scrollIntoViewIfNeeded();
	await head.click();
	await p.mouse.move(0, 0);
	await p.waitForTimeout(350);
}

const browser = await chromium.launch({ executablePath, headless: true });
for (const dark of [false, true]) {
	const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1 });
	await ctx.addInitScript((d) => localStorage.setItem('dark', JSON.stringify(d)), dark);
	for (const s of shots) {
		const p = await ctx.newPage();
		p.on('pageerror', (e) => console.error(`${s.name}: ${e.message}`));
		await p.goto(base + s.path, { waitUntil: 'networkidle' });
		await p.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }' });
		if (s.act) await s.act(p);
		const file = `${out}/${s.name}-${dark ? 'dark' : 'light'}.png`;
		if (typeof s.clip === 'string') await p.locator(s.clip).screenshot({ path: file });
		else await p.screenshot({ path: file });
		await p.close();
	}
	await ctx.close();
}
await browser.close();
console.log(`${shots.length * 2} shots in ${out}`);
