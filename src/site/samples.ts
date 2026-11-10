// Sample documents for the live examples. A document is StoredBlock[]: what the editor writes and an app stores.
import type { StoredBlock } from '@atom-forge/brickee';

const p = (text: string, indent = 0): StoredBlock => ({ type: 'md:p', indent, text });
const h = (level: number, text: string): StoredBlock => ({ type: `md:h${level}`, indent: 0, text });
const li = (text: string, indent = 0): StoredBlock => ({ type: 'md:ul', indent, text });

/** A short welcome document: text, lists and every bundled plugin. */
export const welcome = (): StoredBlock[] => [
	h(2, 'Blocks in, JSON out'),
	p('Brickee edits a document as **blocks**: each line is one, dragged by its handle and turned into another type from its menu. Type `/` on an empty line to add one.'),
	li('Text, headings, lists, to-dos, quotes, code and dividers are **markdown**.'),
	li('Everything else is a *plugin* — like the table below.'),
	li('Plugins are plain objects; pass the ones you want.', 1),
	{ type: 'md:todo', indent: 0, text: 'Try the slash menu', props: { checked: true } },
	{ type: 'md:todo', indent: 0, text: 'Write your own block', props: { checked: false } },
	{
		type: 'table',
		indent: 0,
		props: {
			rows: [
				['Block', 'Stored as', 'Markdown'],
				['Paragraph', '`md:p`', 'text'],
				['Table', '`table`', 'GFM table'],
				['Video', '`youtube`', 'link']
			],
			heads: ['top']
		}
	},
	{ type: 'md:quote', indent: 0, text: 'A document is just JSON: store it as it is, render it with the same plugins.' },
	{ type: 'md:code', indent: 0, text: "<Editor bind:value plugins={PLUGINS} />\n<Preview blocks={value} plugins={PLUGINS} />", props: { lang: 'svelte' } }
];

/** A long document, for the split view. */
export const longRead = (): StoredBlock[] =>
	Array.from({ length: 8 }, (_, i) => [
		h(2, `Chapter ${i + 1}`),
		p('Scroll the editor on the left: the preview follows, keeping the same fraction of its height in view. The two show roughly the same place, not the same block — a table or a video can be taller on one side than on the other.'),
		p('The sync is one way, from the editor to the preview, and it also re-aligns when the preview changes size.'),
		...(i % 3 === 1 ? [{ type: 'gap', indent: 0, props: { lines: '2' } } as StoredBlock] : []),
		li('A list item'),
		li('Another list item')
	]).flat();
