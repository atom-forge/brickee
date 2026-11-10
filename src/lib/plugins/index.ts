// The bundled plugins: plugins like any other (written with the kit), an app picks the ones it wants. Only general
// blocks live here (video, map, table, gap); anything an app gives its own meaning to belongs in the app.
import { MapPin, SquarePlay, Table, UnfoldVertical } from '@lucide/svelte';
import { mdText } from '../kit/util';
import type { BlockPlugin } from '../types';
import { youtubeId } from './util';

import Gap, { GAP_LINES, type GapProps } from './Gap.svelte';
import GapPreview from './GapPreview.svelte';
import MapView, { type MapProps } from './Map.svelte';
import MapPreview from './MapPreview.svelte';
import TableView, { tableHeads, type TableProps } from './Table.svelte';
import TablePreview from './TablePreview.svelte';
import YouTube, { type YouTubeProps } from './YouTube.svelte';
import YouTubePreview from './YouTubePreview.svelte';

// Markdown forms (BlockPlugin.markdown).
const mdLink = (text: unknown, url: string) => `[${mdText(text) || url}](${url})`;
/** One table row in GFM; the cells are inline markdown already, only the pipes are escaped. */
const mdRow = (cells: string[]) => `| ${cells.map((c) => (c ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>')).join(' | ')} |`;

/** A YouTube video, loaded on click. */
export const youtube: BlockPlugin<YouTubeProps> = {
	type: 'youtube',
	label: 'YouTube',
	hint: 'Video from a link',
	keys: 'youtube video embed',
	icon: SquarePlay,
	props: () => ({ id: '', title: '' }),
	fields: [
		{ key: 'id', label: 'Video link or id', kind: 'text', placeholder: 'https://youtu.be/…', parse: youtubeId },
		{ key: 'title', label: 'Title', kind: 'text' }
	],
	tag: () => 'youtube',
	content: 'none',
	markdown: (p) => (p.id ? mdLink(p.title, `https://www.youtube.com/watch?v=${p.id}`) : ''),
	view: YouTube,
	preview: YouTubePreview
};





/** Rows and columns of inline-formatted cells (price lists, fines…); edited in place, rows and columns dragged by their
 * grips. The first row can be a header, the last a footer (sums). */
export const table: BlockPlugin<TableProps> = {
	type: 'table',
	label: 'Table',
	hint: 'Rows and columns',
	keys: 'table grid rows columns price list',
	icon: Table,
	props: () => ({ rows: [['', ''], ['', '']], heads: ['top'] }),
	tag: (p) => `table · ${p.rows?.length ?? 0}×${p.rows?.[0]?.length ?? 0}`,
	content: 'none',
	markdown: (p) => {
		const rows = p.rows ?? [];
		if (!rows.length) return '';
		const body = tableHeads(p).has('top') ? rows.slice(1) : rows;
		const head = tableHeads(p).has('top') ? rows[0] : rows[0].map(() => '');
		return [mdRow(head), mdRow(head.map(() => '---')), ...body.map(mdRow)].join('\n');
	},
	view: TableView,
	preview: TablePreview
};

/** A Google Maps embed of a place or an address. */
export const map: BlockPlugin<MapProps> = {
	type: 'map',
	label: 'Map',
	hint: 'Google Maps for a place',
	keys: 'map google location address place',
	icon: MapPin,
	props: () => ({ q: '', zoom: '15' }),
	fields: [
		{ key: 'q', label: 'Place or address', kind: 'text', placeholder: 'e.g. Pécs, Széchenyi tér' },
		{ key: 'zoom', label: 'Zoom', kind: 'slider', options: Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })) }
	],
	tag: (p) => (p.q ? `map · ${p.q}` : 'map'),
	content: 'none',
	markdown: (p) => (p.q ? mdLink(p.q, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(p.q))}`) : ''),
	view: MapView,
	preview: MapPreview
};

/** Empty space between blocks, some lines of text high; only its height can be set. */
export const gap: BlockPlugin<GapProps> = {
	type: 'gap',
	label: 'Gap',
	hint: 'Empty space',
	keys: 'gap space spacer whitespace',
	icon: UnfoldVertical,
	props: () => ({ lines: '1' }),
	fields: [{ key: 'lines', label: 'Height', kind: 'slider', options: GAP_LINES }],
	tag: (p) => `gap · ${p.lines ?? '1'}`,
	content: 'none',
	view: Gap,
	preview: GapPreview
};

export const PLUGINS: BlockPlugin[] = [table, youtube, map, gap];

export { youtubeId } from './util';
export type { GapProps, MapProps, TableProps, YouTubeProps };
export { square, tableHeads, rowHead, HEADS, type Head } from './Table.svelte';
export { GAP_LINES, GAP_MAX, gapLines } from './Gap.svelte';
export { mapSrc } from './Map.svelte';
