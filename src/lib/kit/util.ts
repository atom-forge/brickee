// Helpers for writing plugins: values come from the block fields, so the previews only use safe ones.

/** A #hex colour, or the fallback. */
export const safeColor = (c: unknown, fallback: string) => (/^#[0-9a-f]{3,8}$/i.test(String(c ?? '')) ? String(c) : fallback);

export const lines = (s: string) =>
	s
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);

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
