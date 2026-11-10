// Helpers of the bundled plugins (the general ones are in kit/util.ts).
export { lines, safeColor } from '../kit/util';

/** A YouTube video id from an id or any YouTube link. */
export function youtubeId(s: string) {
	const t = s.trim();
	const m = /(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/.exec(t);
	return m ? m[1] : t.replace(/[^\w-]/g, '').slice(0, 11);
}
