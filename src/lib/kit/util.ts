// Helpers for writing plugins: values come from the block fields, so the previews only use safe ones.

/** A #hex colour, or the fallback. */
export const safeColor = (c: unknown, fallback: string) => (/^#[0-9a-f]{3,8}$/i.test(String(c ?? '')) ? String(c) : fallback);

export const lines = (s: string) =>
	s
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);

const byView = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The base value of a per-view prop (see PropField.views): the value itself, or the first view's. */
export const baseValue = (v: unknown) => (byView(v) ? Object.values(v)[0] : v);

/** A per-view prop's value for each of these views (the first is the base); a view without its own takes the one before. */
export function viewValues(v: unknown, keys: string[]): unknown[] {
	const own = byView(v) ? v : { [keys[0]]: v };
	let last: unknown;
	return keys.map((k) => (last = own[k] ?? last));
}

/** Plain text made safe inside markdown (no inline marks, no block start). */
export const mdText = (s: unknown) =>
	String(s ?? '')
		.replace(/[\\`*~[\]<_#]/g, '\\$&')
		.replace(/\n+/g, ' ')
		.trim();

/** Markdown lines quoted (`> `), for a box rendered as a blockquote. */
export const mdQuote = (md: string) =>
	md
		.split('\n')
		.map((l) => (l ? `> ${l}` : '>'))
		.join('\n');

/** Markdown parts joined as separate blocks, empty ones left out. */
export const mdJoin = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join('\n\n');
