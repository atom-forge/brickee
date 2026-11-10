---
type: chapter
teaches: [stored-block]
---
# Documents and markdown

## The stored form

A document is an array of `StoredBlock` objects — plain JSON you can save in a database column as it is:

```ts
interface StoredBlock {
	type: string; // 'md:p', 'md:h2'… for built-in blocks; the plugin's type for plugin blocks
	indent: number; // 0–6
	text?: string; // built-in blocks: inline markdown (raw text for md:code)
	props?: Record<string, unknown>; // plugin settings; md:todo { checked }, md:code { lang }
	blocks?: StoredBlock[]; // plugins with nested blocks: their inner document
}
```

A short document with a paragraph, a list, a video and a box (the `note` container from [[writing-plugins#Containers|Writing plugins]]):

```json
[
	{ "type": "md:h2", "indent": 0, "text": "Getting there" },
	{ "type": "md:p", "indent": 0, "text": "Take the **night train** or see the [timetable](https://example.com/trains)." },
	{ "type": "md:ul", "indent": 0, "text": "Tickets online" },
	{ "type": "md:ul", "indent": 1, "text": "Students get *20%* off" },
	{ "type": "youtube", "indent": 0, "props": { "id": "aqz-KE-bpKQ", "title": "The route by night" } },
	{
		"type": "note",
		"indent": 0,
		"props": { "title": "Good to know" },
		"blocks": [{ "type": "md:p", "indent": 0, "text": "Trains are cancelled on public holidays." }]
	}
]
```

- Built-in types carry the `md:` prefix (`MD` constant, `isMd(block)` test); everything else is a plugin type.
- Plugin blocks keep only `type`, `indent`, `props` and, for containers, `blocks`. What the props mean is up to the plugin.
- Nested blocks go one level deep: a block inside a box cannot hold blocks itself (`MAX_DEPTH` is 2).
- The editor's own working form (`Block`, with an `id` and inline HTML) is never stored; `toStored` and `fromStored` convert between the two.

## Built-in blocks

| Type | Stored text | Props | Markdown |
|---|---|---|---|
| `md:p` | inline markdown | — | the text |
| `md:h1` … `md:h6` | inline markdown | — | `#` … `######` |
| `md:ul` | inline markdown | — | `- item` |
| `md:ol` | inline markdown | — | `1. item` (numbered per run and indent level) |
| `md:todo` | inline markdown | `{ checked: boolean }` | `- [x] item` |
| `md:quote` | inline markdown | — | `> quote` |
| `md:code` | raw text | `{ lang?: string }` | fenced block with the language |
| `md:hr` | — | — | `---` |

`indent` nests list items (consecutive list blocks become properly nested `ul`/`ol` elements in the preview) and indents paragraphs and quotes. Headings, code and dividers ignore it.

### Inline markdown

The text of a built-in block is a small, safe subset of markdown:

| Mark | Stored as |
|---|---|
| bold | `**text**` |
| italic | `*text*` |
| underline, subscript, superscript | `<u>text</u>`, `<sub>text</sub>`, `<sup>text</sup>` |
| strikethrough | `~~text~~` |
| code | `` `text` `` |
| link | `[text](url)` — only `http:`, `https:`, `mailto:`, `tel:` and site-relative `/…` targets become links |
| line break | a newline |

Special characters in plain text are backslash-escaped, so they never turn into markup. `inline(md)` turns inline markdown into HTML: it escapes the text first and only then adds the tags above, so its output is safe to render with `{@html}` — this is what the preview does.

## Markdown in and out

Markdown is a first-class format: the clipboard carries it, and a host can import and export it.

| Function | From → to | Runs |
|---|---|---|
| `fromStored(block)` | `StoredBlock` → `Block` | anywhere |
| `toStored(block)` | `Block` → `StoredBlock` | browser only |
| `fromMarkdown(text)` | markdown → `Block[]` | anywhere |
| `toMarkdown(blocks, { plugins })` | `Block[]` → markdown | browser only |
| `inline(md)` | inline markdown → inline HTML | anywhere |

The markdown functions work on the editor form (`Block[]`), so stored documents go through `fromStored` and `toStored`:

```ts
import { fromMarkdown, fromStored, toMarkdown, toStored, type StoredBlock } from '@atom-forge/brickee';
import { PLUGINS } from '@atom-forge/brickee/plugins';

// Stored document -> markdown (browser only).
export const exportMarkdown = (doc: StoredBlock[]) => toMarkdown(doc.map(fromStored), { plugins: PLUGINS });

// Markdown -> stored document (browser only).
export const importMarkdown = (text: string): StoredBlock[] => fromMarkdown(text).map(toStored);
```

> [!warning] Browser only
> `toMarkdown` and `toStored` read the editor's inline HTML through the DOM, so they need `document`. Call them in the browser (an event handler, an effect), not during server-side rendering. For server-side text, use `blocksToPlainText` (see [[server-side|On the server]]).

What `fromMarkdown` reads:

- headings, bulleted, numbered and to-do items, quotes, fenced code blocks with their language, dividers, and the inline marks above;
- leading spaces as indentation (two spaces or one tab per level);
- every non-empty line as its own block — it does not join wrapped lines into one paragraph, and it creates built-in blocks only (no tables, images or plugin blocks).

What `toMarkdown` writes:

- consecutive list items on consecutive lines, every other block separated by a blank line;
- list items and paragraphs indented by two spaces per level;
- a plugin block through its plugin's `markdown(props, { inner })`, where `inner` is its nested blocks already converted; a plugin without a markdown form, or one returning `''`, is left out.

Writing a markdown form for your own plugin is covered in [[writing-plugins#Markdown form|Writing plugins]].
