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

A short document with a paragraph, a list, a video and a box (the `note` container from [[writing-plugins#containers|Writing plugins]]):

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
| `md:ol` | inline markdown | `{ start?: number }` on a list's first item | `1. item` (numbered per run and indent level, from `start` when given) |
| `md:todo` | inline markdown | `{ checked: boolean }` | `- [x] item` |
| `md:quote` | inline markdown | — | `> quote` |
| `md:code` | raw text | `{ lang?: string }` | fenced block with the language |
| `md:hr` | — | — | `---` |

`indent` nests list items (consecutive list blocks become properly nested `ul`/`ol` elements in the preview), puts paragraphs and code blocks under a list item, and nests quotes (`> > …`). Headings and dividers ignore it.

### Inline markdown

The text of a built-in block is a small, safe subset of markdown:

| Mark | Stored as |
|---|---|
| bold | `**text**` (read also: `__text__`) |
| italic | `*text*` (read also: `_text_`, not inside a word) |
| underline, subscript, superscript | `<u>text</u>`, `<sub>text</sub>`, `<sup>text</sup>` |
| strikethrough | `~~text~~` |
| code | `` `text` `` (a longer backtick run when the code holds backticks: ``` `` a`b `` ```) |
| link | `[text](url)` — only `http:`, `https:`, `mailto:`, `tel:` and site-relative `/…` targets become links; parentheses in a target must be balanced. Read also: a title (dropped), `<https://…>` autolinks, and an image `![alt](url)` as a link |
| line break | a newline (in markdown out: a backslash at the line's end) |
| inline plugin | its own markdown form, e.g. `$x^2$` for `inlineMath` (only with `inlinePlugins`); a `$` typed as text is stored as `\$` |

Special characters in plain text are backslash-escaped, so they never turn into markup; any ASCII punctuation can be escaped. Reading stays linear on any input, with these limits: a marked span is at most 2000 characters, a link label has no brackets of its own and is at most 1000 characters, a link target at most 2000. When reading, inline HTML maps onto the marks (`<strong>`, `<em>`, `<del>`, `<br>`…), other tags are dropped with their text kept, and a footnote reference `[^1]` becomes a superscript. `inline(md)` turns inline markdown into HTML: it escapes the text first and only then adds the tags above, so its output is safe to render with `{@html}` — this is what the preview does.

## Markdown in and out

Markdown is a first-class format: the clipboard carries it, and a host can import and export it.

| Function | From → to | Runs |
|---|---|---|
| `fromStored(block)` | `StoredBlock` → `Block` | anywhere |
| `toStored(block)` | `Block` → `StoredBlock` | browser only |
| `fromMarkdown(text, { plugins })` | markdown → `Block[]` | anywhere |
| `fromHtml(html, { plugins })` | HTML (a formatted paste, a page) → `Block[]` | browser only |
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

- headings (also setext: a line underlined with `===` or `---`, and with closing `#`s), bulleted, numbered (with their start number) and to-do items, quotes (nested ones one level deeper), fenced code (backticks or tildes, any length, closed by a fence at least as long) and indented code, dividers, and the inline marks above;
- list nesting by the items' markers: a line indented past an item's marker is inside the item (so `1. ` items nest with two, three or four spaces);
- the lines of a paragraph, a list item or a quote as one block, with line breaks between them; a blank line, or `>` alone in a quote, starts a new one;
- reference links (`[text][id]` with `[id]: url`) resolved, footnote definitions as a paragraph after their number;
- a GFM table as a block of the first of `plugins` that takes tables (`fromTable`, see [[writing-plugins#taking-pasted-tables|Writing plugins]]; the bundled `table` does), otherwise as text. The editor passes the plugins it offers, so a pasted table becomes a table block.

What `fromHtml` reads — the editor uses it for a formatted paste from a web page, Google Docs or Word: headings, paragraphs, lists (nested, numbered with their start, to-dos from checkboxes), quotes, code (`pre`, with a `language-…` class), rules, tables (for a plugin that takes them), and the inline marks — also Google Docs' bold, italic and struck-through spans. Images become links (the package has no images), and scripts, styles and form controls are dropped. The HTML is only read: it goes through markdown and the same safe rendering as everything else.

What `toMarkdown` writes:

- consecutive list items on consecutive lines, consecutive quotes as one quote (`>` between their paragraphs), every other block separated by a blank line;
- nested items, and paragraphs and code under an item, indented to the item's content (two spaces under `- `, three under `1. `, four under `10. `);
- code in a fence longer than any backtick run in it, and plain text escaped where markdown would read it as markup (`\_`, `1\.` at a line's start…);
- a plugin block through its plugin's `markdown(props, { inner })`, where `inner` is its nested blocks already converted; a plugin without a markdown form, or one returning `''`, is left out.

Writing a markdown form for your own plugin is covered in [[writing-plugins#markdown-form|Writing plugins]].
