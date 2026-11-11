<script lang="ts">
	import { getContext, onDestroy, setContext, tick, untrack } from 'svelte';
	import { Bold, Check, Code, GripVertical, Italic, Link, Plus, RemoveFormatting, Replace, Strikethrough, Subscript, Superscript, Trash2, Underline, Ungroup } from '@lucide/svelte';
	import {
		rich,
		clean,
		textLen,
		splitAtCaret,
		atStart,
		atEnd,
		caretOffset,
		caretRect,
		caretAt,
		setCaret,
		removeBeforeCaret,
		onEdgeLine,
		focusAtEdge,
		toggleCode,
		plainText
	} from './dom';
	import { fromMarkdown, fromStored, plainHtml, toMarkdown, toStored } from './markdown';
	import { useCodeLanguages } from './code';
	import { provideText, useText, type Messages } from './i18n';
	import { PopupContainer, createPopupManager, getPopupManager } from '@atom-forge/ui';
	import LinkPrompt from './LinkPrompt.svelte';
	import PluginHost from './PluginHost.svelte';
	import PropsBar from './PropsBar.svelte';
	import { acceptsId, BUILT_IN_IDS, PALETTE_ITEMS, type Icon, type PaletteItem } from './palette';
	import { MAX_INDENT, newBlock, numbering, uid, type Block, type BlockPlugin, type BlockType, type StoredBlock, type PropField, type Content, BUILT_IN_CONTENT, isMd, MD } from './types';

	const HUB = 'brickee:hub';

	interface Props {
		/** The document: built-in blocks as markdown snippets, plugin blocks with their props. */
		value?: StoredBlock[];
		readonly?: boolean;
		placeholder?: string;
		/** Built-in block types and plugin types offered in the slash menu, in this order. Shortcuts and paste respect it too. */
		palette?: string[];
		/** Custom blocks this editor can show and offer. */
		plugins?: BlockPlugin[];
		/** Set by plugins with nested blocks: a compact editor inside another block. */
		nested?: boolean;
		/** UI text in the host's language (English text -> translation); nested editors share their parent's. */
		messages?: Messages;
	}
	let {
		value: doc = $bindable([]),
		readonly = false,
		placeholder: placeholderProp,
		palette: paletteProp,
		plugins = [],
		nested = false,
		messages
	}: Props = $props();

	provideText(() => messages);
	// Popups (the link field) are atom-forge popups; the top editor has their container, nested editors share it.
	// svelte-ignore state_referenced_locally
	const popups = nested ? getPopupManager() : createPopupManager(getPopupManager());
	const tr = useText();
	const placeholder = $derived(placeholderProp ?? tr("Write something, or press '/' for blocks…"));

	// One level of nesting: an editor inside a block offers no block types that hold blocks themselves, nor unique
	// ones (those belong to the top level).
	const palette = $derived(
		(paletteProp ?? [...BUILT_IN_IDS, ...plugins.map((p) => p.type)]).filter((id) => {
			const p = plugins.find((x) => x.type === id);
			return !(nested && (p?.content === 'blocks' || p?.unique));
		})
	);
	const pluginOf = (type: string | undefined) => plugins.find((p) => p.type === type);
	/** Blocks the caret cannot enter from outside: dividers and plugin blocks. */
	const atomic = (b: Block) => b.type === 'hr' || b.type === 'plugin';

	/* ------------------------------------------------------------ document io */

	// The editor works on html blocks; `doc` is their markdown form, written back on every change (not when read-only:
	// showing a document must not change it).
	const load = (d: StoredBlock[]) => (d.length ? d.map(fromStored) : [newBlock()]);
	let value = $state<Block[]>(load(doc));

	// The stored form of a built-in block, kept while the block does not change: typing in one block converts only that
	// block (its inline html goes through the DOM), and the others keep their objects, so a preview re-renders only it.
	// Plugin blocks are cheap to convert and keep their `props` and `blocks` objects anyway.
	const stored = new Map<string, { key: string; out: StoredBlock }>();
	function storedOf(b: Block): StoredBlock {
		if (b.type === 'plugin') return toStored(b);
		const key = `${b.type}|${b.indent}|${b.checked ?? ''}|${b.props?.lang ?? ''}|${b.props?.start ?? ''}|${b.html}`;
		const hit = stored.get(b.id);
		if (hit?.key === key) return hit.out;
		const out = toStored(b);
		stored.set(b.id, { key, out });
		return out;
	}

	// What we wrote last, and `doc` as read back after writing it (the host's state may wrap it in its own proxy).
	let written: StoredBlock[] | null = null;
	let readBack: unknown = untrack(() => doc);
	$effect(() => {
		const out = value.map(storedOf);
		if (stored.size > out.length * 2) for (const id of [...stored.keys()]) if (!value.some((b) => b.id === id)) stored.delete(id);
		if (untrack(() => readonly)) return;
		written = out;
		doc = out;
		readBack = untrack(() => doc);
	});
	// A document replaced from outside (not by our own write) is loaded again; an equal copy is not.
	$effect(() => {
		const d = doc;
		if (d === readBack) return;
		readBack = d;
		if (JSON.stringify(d) === JSON.stringify(written ?? untrack(() => value.map(storedOf)))) return;
		value = load(d);
		// Another document (or this one reverted by the editor around a nested one): the old steps no longer apply.
		untrack(() => forget());
	});

	/* ------------------------------------------------------------------ state */

	let root: HTMLDivElement;
	let focusedId = $state<string | null>(null);
	let selA = $state<string | null>(null); // block-selection anchor
	let selH = $state<string | null>(null); // block-selection head
	let slash = $state<{ id: string; query: string; x: number; y: number; up: boolean; index: number } | null>(null);
	let toolbar = $state<{ x: number; y: number } | null>(null);

	// State shared by an editor and every editor nested in its plugin blocks: blocks can be dragged between them,
	// and only the editor last worked in keeps a block selection.
	type DragSource = { editor: string; ids: string[]; payload: StoredBlock[]; rows: HTMLElement[]; remove: () => void };
	type Hub = {
		src: DragSource | null;
		target: { editor: string; over: string; after: boolean } | null;
		active: string | null;
	};
	// A string, not an object: $state would proxy an object and break identity checks.
	const token = uid();
	const ownHub = $state<Hub>({ src: null, target: null, active: null });
	const hub: Hub = getContext<Hub>(HUB) ?? ownHub;
	setContext(HUB, hub);

	$effect(() => {
		if (selA) hub.active = token;
	});
	$effect(() => {
		if (hub.active !== token) untrack(() => (selA = selH = null));
	});

	const idx = (id: string) => value.findIndex((b) => b.id === id);
	// Direct children only: a plugin row may hold a nested editor with its own blocks.
	const el = (id: string) => root?.querySelector<HTMLElement>(`[data-block="${id}"] > .body > .ce`) ?? null;
	const ownRow = (n: Element | null) => {
		let row = n?.closest<HTMLElement>('[data-block]') ?? null;
		while (row && row.parentElement !== root) row = row.parentElement?.closest<HTMLElement>('[data-block]') ?? null;
		return row;
	};
	const nums = $derived(numbering(value));

	const selSet = $derived.by(() => {
		if (!selA || !selH) return new Set<string>();
		const a = idx(selA);
		const h = idx(selH);
		if (a < 0 || h < 0) return new Set<string>();
		const [lo, hi] = a < h ? [a, h] : [h, a];
		return new Set(value.slice(lo, hi + 1).map((b) => b.id));
	});

	async function focusBlock(id: string, where: 'start' | 'end' | number = 'end') {
		await tick();
		const e = el(id);
		if (e) setCaret(e, where);
		else selectOnly(id);
	}

	/* ---------------------------------------------------------------- history */

	type Snap = { blocks: string; id: string | null; off: number };
	const take = (): Snap => {
		const e = focusedId ? el(focusedId) : null;
		return { blocks: JSON.stringify($state.snapshot(value)), id: focusedId, off: e ? caretOffset(e) : 0 };
	};
	let past: Snap[] = [];
	let future: Snap[] = [];
	let last: Snap = take();
	let pending = false;
	let timer: ReturnType<typeof setTimeout>;

	/** Call on every text edit: consecutive typing collapses into one undo step. */
	function typed() {
		if (!pending) {
			past.push(last);
			if (past.length > 300) past.shift();
			future = [];
			pending = true;
		}
		clearTimeout(timer);
		timer = setTimeout(() => {
			pending = false;
			last = take();
		}, 600);
	}

	/** Wrap every structural change: pushes an undo step. */
	function mutate(fn: () => void) {
		clearTimeout(timer);
		pending = false;
		past.push(take());
		if (past.length > 300) past.shift();
		future = [];
		fn();
		last = take();
	}

	/** Drops the undo and redo steps (a document loaded from outside). */
	function forget() {
		clearTimeout(timer);
		pending = false;
		past = [];
		future = [];
		last = take();
	}

	function restore(s: Snap) {
		value = JSON.parse(s.blocks);
		selA = selH = null;
		slash = null;
		last = s;
		if (s.id && idx(s.id) >= 0) focusBlock(s.id, s.off);
	}
	function undo() {
		clearTimeout(timer);
		pending = false;
		const s = past.pop();
		if (!s) return;
		future.push(take());
		restore(s);
	}
	function redo() {
		clearTimeout(timer);
		pending = false;
		const s = future.pop();
		if (!s) return;
		past.push(take());
		restore(s);
	}

	/* ---------------------------------------------------------- block catalog */

	// The palette picks and orders the slash menu; plain text ('p') is always allowed as the fallback.
	// Labels and hints in the host's language; the slash menu finds a block by its English and translated words too.
	const catalog = $derived<PaletteItem[]>(
		[...PALETTE_ITEMS, ...plugins.map((p) => ({ ...p, id: p.type }))].map((it) => ({
			...it,
			label: tr(it.label),
			hint: tr(it.hint),
			keys: `${it.label} ${it.keys} ${tr(it.keys)}`
		}))
	);
	// A unique plugin leaves the menus once the document has one.
	const items = $derived(
		palette
			.map((id) => catalog.find((it) => it.id === id))
			.filter((it): it is PaletteItem => !!it && !(pluginOf(it.id)?.unique && value.some((b) => b.plugin === it.id)))
	);
	// Editor-side names: built-in kinds without the md: prefix (p, h1…), plugin types as they are.
	const allowed = $derived(new Set<string>(['p', ...palette.map((id) => (id.startsWith(MD) ? id.slice(MD.length) : id))]));

	/** Pasted blocks of a type outside the palette become plain text; dividers are dropped. */
	const fit = (blocks: Block[]) =>
		blocks
			.filter((b) => b.type !== 'hr' || allowed.has('hr'))
			.map((b) => {
				if (b.type !== 'plugin' && !allowed.has(b.type)) convert(b, 'p');
				return b;
			});

	type Cmd = 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'subscript' | 'superscript' | 'code' | 'link' | 'plain';
	const tools: { cmd: Cmd; icon: Icon; title: string }[] = [
		{ cmd: 'bold', icon: Bold, title: 'Bold (Ctrl+B)' },
		{ cmd: 'italic', icon: Italic, title: 'Italic (Ctrl+I)' },
		{ cmd: 'underline', icon: Underline, title: 'Underline (Ctrl+U)' },
		{ cmd: 'strikeThrough', icon: Strikethrough, title: 'Strikethrough (Ctrl+Shift+X)' },
		{ cmd: 'subscript', icon: Subscript, title: 'Subscript (NO₂)' },
		{ cmd: 'superscript', icon: Superscript, title: 'Superscript (m²)' },
		{ cmd: 'code', icon: Code, title: 'Code (Ctrl+E)' },
		{ cmd: 'link', icon: Link, title: 'Link (Ctrl+K)' },
		{ cmd: 'plain', icon: RemoveFormatting, title: 'Plain text: remove the formatting (Ctrl+\\)' }
	];
	const hints: Partial<Record<BlockType, string>> = {
		h1: 'Heading 1',
		h2: 'Heading 2',
		h3: 'Heading 3',
		h4: 'Heading 4',
		h5: 'Heading 5',
		h6: 'Heading 6',
		ul: 'List item',
		ol: 'List item',
		todo: 'To-do',
		quote: 'Quote',
		code: 'Code'
	};
	const hintFor = (t: BlockType) => (hints[t] ? tr(hints[t]) : placeholder);

	const filtered = $derived(
		slash ? items.filter((it) => (it.label + ' ' + it.keys).toLowerCase().includes(slash!.query.toLowerCase())) : []
	);

	function convert(b: Block, type: BlockType) {
		b.type = type;
		if (type === 'todo') b.checked = false;
		else delete b.checked;
		if (type !== 'code') delete b.props;
		if (type === 'hr') b.html = '';
		delete b.plugin;
		delete b.blocks;
	}

	/* -------------------------------------------------------------- slash menu */

	function detectSlash(ce: HTMLElement, b: Block) {
		const sel = getSelection();
		if (!sel || !sel.rangeCount || !sel.isCollapsed || b.type === 'code') {
			slash = null;
			return;
		}
		const r = sel.getRangeAt(0);
		if (!ce.contains(r.startContainer)) {
			slash = null;
			return;
		}
		const pre = document.createRange();
		pre.selectNodeContents(ce);
		pre.setEnd(r.startContainer, r.startOffset);
		const m = /(?:^|[\s ])\/([^\s/]*)$/.exec(pre.toString());
		if (!m) {
			slash = null;
			return;
		}
		const rect = caretRect() ?? ce.getBoundingClientRect();
		const up = rect.bottom + 300 > innerHeight && rect.top > 300;
		slash = {
			id: b.id,
			query: m[1],
			x: Math.min(rect.left, innerWidth - 270),
			y: up ? rect.top - 6 : rect.bottom + 6,
			up,
			index: slash && slash.id === b.id && slash.query === m[1] ? slash.index : 0
		};
	}

	// Keep the highlighted item visible while moving through the menu with the arrow keys.
	$effect(() => {
		if (slash?.index === undefined && turn?.index === undefined) return;
		root.querySelector(':scope > .menu .item.active')?.scrollIntoView({ block: 'nearest' });
	});

	function applySlash(item: PaletteItem) {
		if (!slash) return;
		const b = value[idx(slash.id)];
		const ce = el(slash.id);
		if (!b || !ce) return;
		const n = slash.query.length + 1;
		slash = null;
		removeBeforeCaret(n);
		b.html = clean(ce.innerHTML);
		const off = caretOffset(ce);
		const plugin = pluginOf(item.id);
		if (plugin) return insertPlugin(b, plugin);
		const type = item.id.slice(MD.length) as BlockType;
		mutate(() => {
			convert(b, type);
			if (type === 'hr') {
				const i = idx(b.id);
				const nb = newBlock();
				value = [...value.slice(0, i + 1), nb, ...value.slice(i + 1)];
				focusBlock(nb.id, 'start');
			} else focusBlock(b.id, off);
		});
	}

	// Plugin blocks made in this session: their fields start open (the others show only their small header).
	const fresh = new Set<string>();

	/** Puts a plugin block in place of an empty block (or after a filled one) and enters its nested editor. */
	async function insertPlugin(b: Block, plugin: BlockPlugin) {
		const pb = newBlock('plugin', '', {
			plugin: plugin.type,
			indent: b.indent,
			props: plugin.props(),
			...(plugin.content === 'blocks' ? { blocks: [{ type: 'md:p', text: '', indent: 0 }] } : {})
		});
		fresh.add(pb.id);
		const i = idx(b.id);
		mutate(() => {
			const keep = b.html ? [b] : [];
			const after = value[i + 1] ? [] : [newBlock()];
			value = [...value.slice(0, i), ...keep, pb, ...after, ...value.slice(i + 1)];
		});
		await tick();
		await tick();
		const inner = root.querySelector<HTMLElement>(`[data-block="${pb.id}"] .ce`);
		if (inner) setCaret(inner, 'start');
		else selectOnly(pb.id);
	}

	function handleSlashKey(e: KeyboardEvent): boolean {
		if (!slash || !filtered.length) return false;
		const n = filtered.length;
		if (e.key === 'ArrowDown') slash.index = (slash.index + 1) % n;
		else if (e.key === 'ArrowUp') slash.index = (slash.index - 1 + n) % n;
		else if (e.key === 'Enter' || e.key === 'Tab') applySlash(filtered[Math.min(slash.index, n - 1)]);
		else if (e.key === 'Escape') slash = null;
		else return false;
		e.preventDefault();
		return true;
	}

	/* ----------------------------------------------------------------- editing */

	function enter(b: Block, ce: HTMLElement) {
		const i = idx(b.id);
		const text = ce.textContent ?? '';

		if (b.type === 'p' && text === '---' && allowed.has('hr')) {
			mutate(() => {
				b.type = 'hr';
				b.html = '';
				const nb = newBlock();
				value = [...value.slice(0, i + 1), nb, ...value.slice(i + 1)];
				focusBlock(nb.id, 'start');
			});
			return;
		}
		const fence = /^```([\w+#.-]*)$/.exec(text);
		if (b.type === 'p' && fence && allowed.has('code')) {
			mutate(() => {
				b.type = 'code';
				b.html = '';
				if (fence[1]) b.props = { lang: fence[1] };
				ce.innerHTML = '';
			});
			focusBlock(b.id, 'start');
			return;
		}
		if (!text && (b.type === 'ul' || b.type === 'ol' || b.type === 'todo' || b.type === 'quote')) {
			mutate(() => {
				if (b.indent > 0) b.indent--;
				else convert(b, 'p');
			});
			focusBlock(b.id, 'end');
			return;
		}

		const parts = splitAtCaret(ce);
		if (!parts) return;
		const pre = clean(parts[0]);
		const post = clean(parts[1]);

		if (!pre && post) {
			// Enter at the very start of a filled block pushes it down.
			mutate(() => {
				value = [...value.slice(0, i), newBlock(b.type, '', { indent: b.indent }), ...value.slice(i)];
			});
			return;
		}
		const type: BlockType = /^h\d$/.test(b.type) ? 'p' : b.type;
		const nb = newBlock(type, post, { indent: b.indent, ...(type === 'todo' ? { checked: false } : {}) });
		mutate(() => {
			b.html = pre;
			value = [...value.slice(0, i + 1), nb, ...value.slice(i + 1)];
		});
		focusBlock(nb.id, 'start');
	}

	function goTo(i: number, up: boolean, x: number) {
		const t = value[i];
		if (!t) return;
		const te = el(t.id);
		if (!te) return selectOnly(t.id);
		const r = te.getBoundingClientRect();
		if (!caretAt(te, x, up ? r.bottom - 3 : r.top + 3)) setCaret(te, up ? 'end' : 'start');
	}

	function onKeydown(e: KeyboardEvent, b: Block) {
		if (e.isComposing || e.keyCode === 229) return;
		const ce = e.currentTarget as HTMLElement;
		const mod = e.metaKey || e.ctrlKey;
		const key = e.key;
		const i = idx(b.id);

		if (slash && handleSlashKey(e)) return;

		if (mod) {
			const k = key.toLowerCase();
			let handled = true;
			if (k === 'z') {
				if (e.shiftKey) redo();
				else undo();
			} else if (k === 'y') redo();
			else if (k === 'b') fmt('bold');
			else if (k === 'i') fmt('italic');
			else if (k === 'u') fmt('underline');
			else if (k === 'e') fmt('code');
			else if (k === 'k') fmt('link');
			else if (k === '\\') fmt('plain');
			else if (k === 'x' && e.shiftKey) fmt('strikeThrough');
			else if (k === 'a' && (!ce.textContent || getSelection()?.toString() === ce.textContent)) {
				selA = value[0].id;
				selH = value[value.length - 1].id;
				blurActive();
				root.focus();
			} else if (e.shiftKey && (key === 'ArrowUp' || key === 'ArrowDown')) nudge([b.id], key === 'ArrowUp' ? -1 : 1);
			else if (key === 'Enter' && b.type === 'code') {
				const nb = newBlock();
				mutate(() => (value = [...value.slice(0, i + 1), nb, ...value.slice(i + 1)]));
				focusBlock(nb.id, 'start');
			} else handled = false;
			if (handled) return e.preventDefault();
		}

		if (key === 'Escape') {
			e.preventDefault();
			return selectOnly(b.id);
		}

		if (key === 'Enter') {
			e.preventDefault();
			if (b.type === 'code') {
				if (e.shiftKey) {
					const nb = newBlock();
					mutate(() => (value = [...value.slice(0, i + 1), nb, ...value.slice(i + 1)]));
					focusBlock(nb.id, 'start');
				} else document.execCommand('insertLineBreak');
			} else if (e.shiftKey) document.execCommand('insertLineBreak');
			else enter(b, ce);
			return;
		}

		if (key === 'Tab') {
			e.preventDefault();
			const d = e.shiftKey ? -1 : 1;
			const n = Math.max(0, Math.min(MAX_INDENT, b.indent + d));
			if (n !== b.indent) {
				const off = caretOffset(ce);
				mutate(() => (b.indent = n));
				focusBlock(b.id, off);
			}
			return;
		}

		if (key === 'Backspace' && atStart(ce)) {
			e.preventDefault();
			if (b.indent > 0) return mutate(() => b.indent--);
			if (b.type !== 'p') return mutate(() => convert(b, 'p'));
			if (i === 0) return;
			const prev = value[i - 1];
			if (prev.type === 'hr') return mutate(() => (value = value.filter((x) => x.id !== prev.id)));
			if (prev.type === 'plugin') return selectOnly(prev.id);
			const off = textLen(prev.html);
			const merged = prev.html + clean(ce.innerHTML);
			mutate(() => {
				prev.html = merged;
				value = value.filter((x) => x.id !== b.id);
			});
			return void focusBlock(prev.id, off);
		}

		if (key === 'Delete' && atEnd(ce)) {
			const next = value[i + 1];
			if (!next) return;
			e.preventDefault();
			if (next.type === 'hr') return mutate(() => (value = value.filter((x) => x.id !== next.id)));
			if (next.type === 'plugin') return selectOnly(next.id);
			const off = textLen(ce.innerHTML);
			const merged = clean(ce.innerHTML) + next.html;
			mutate(() => {
				b.html = merged;
				value = value.filter((x) => x.id !== next.id);
			});
			return void focusBlock(b.id, off);
		}

		// Shift+arrow past the start or end of the block's text continues as a selection of whole blocks.
		if ((key === 'ArrowUp' || key === 'ArrowDown') && e.shiftKey && !e.altKey && !mod) {
			const up = key === 'ArrowUp';
			const next = value[i + (up ? -1 : 1)];
			if (next && focusAtEdge(ce, up)) {
				e.preventDefault();
				selA = b.id;
				selH = next.id;
				slash = null;
				blurActive();
				root.focus({ preventScroll: true });
			}
			return;
		}

		if ((key === 'ArrowUp' || key === 'ArrowDown') && !e.shiftKey && !e.altKey && !mod) {
			const up = key === 'ArrowUp';
			if (onEdgeLine(ce, up) && value[i + (up ? -1 : 1)]) {
				e.preventDefault();
				const cr = caretRect();
				goTo(i + (up ? -1 : 1), up, cr ? cr.left : ce.getBoundingClientRect().left);
			}
			return;
		}
		if (key === 'ArrowLeft' && !e.shiftKey && !mod && atStart(ce) && i > 0) {
			e.preventDefault();
			const p = value[i - 1];
			return atomic(p) ? selectOnly(p.id) : void focusBlock(p.id, 'end');
		}
		if (key === 'ArrowRight' && !e.shiftKey && !mod && atEnd(ce) && i < value.length - 1) {
			e.preventDefault();
			const n = value[i + 1];
			return atomic(n) ? selectOnly(n.id) : void focusBlock(n.id, 'start');
		}
	}

	function onBeforeInput(e: InputEvent) {
		if (e.inputType === 'historyUndo') {
			e.preventDefault();
			undo();
		} else if (e.inputType === 'historyRedo') {
			e.preventDefault();
			redo();
		}
	}

	function onInput(e: Event, b: Block) {
		const ce = e.currentTarget as HTMLElement;
		if (ce.innerHTML === '<br>') ce.innerHTML = '';
		const text = ce.textContent ?? '';

		if (b.type === 'p' && (e as InputEvent).inputType === 'insertText') {
			const m = /^(#{1,6}|[-*+]|\d{1,3}\.|\[\s?\]|>)[\s ]$/.exec(text);
			const t = m?.[1];
			const type: BlockType | null = !t
				? null
				: t[0] === '#' ? (`h${t.length}` as BlockType) : t === '>' ? 'quote' : t[0] === '[' ? 'todo' : /\d/.test(t[0]) ? 'ol' : 'ul';
			if (type && allowed.has(type)) {
				mutate(() => {
					ce.innerHTML = '';
					b.html = '';
					convert(b, type);
				});
				slash = null;
				return void focusBlock(b.id, 'start');
			}
		}
		typed();
		b.html = ce.innerHTML;
		detectSlash(ce, b);
	}

	/** The editor's own clipboard format: the copied blocks in their stored form, beside their markdown. */
	const CLIP = 'application/x-brickee+json';

	/**
	 * Blocks from the editor's clipboard format, or null when it is missing, of another version or malformed. Each block
	 * carries its markdown form as the copying editor wrote it, for an editor that cannot hold the block (`md`).
	 */
	function fromClip(data: string | undefined): (Block & { md?: string })[] | null {
		if (!data) return null;
		try {
			const clip = JSON.parse(data);
			const ok = (s: unknown, depth: number): s is StoredBlock => {
				const b = s as StoredBlock;
				return (
					!!b && typeof b === 'object' && typeof b.type === 'string' && Number.isInteger(b.indent) && b.indent >= 0 && b.indent <= MAX_INDENT &&
					(b.text === undefined || typeof b.text === 'string') &&
					(b.props === undefined || (typeof b.props === 'object' && !Array.isArray(b.props))) &&
					(b.blocks === undefined || (depth === 0 && Array.isArray(b.blocks) && b.blocks.every((x) => ok(x, 1))))
				);
			};
			if (clip?.v !== 1 || !Array.isArray(clip.blocks) || clip.blocks.length > 2000 || !clip.blocks.every((x: unknown) => ok(x, 0))) return null;
			const md: unknown[] = Array.isArray(clip.md) ? clip.md : [];
			return (clip.blocks as StoredBlock[]).map((s, n) => ({ ...fromStored(s), md: typeof md[n] === 'string' ? (md[n] as string) : undefined }));
		} catch {
			return null;
		}
	}

	/**
	 * Pasted blocks this editor can hold: a plugin block it does not offer (or a unique one it already has) falls back
	 * to its markdown form; built-in types outside the palette become text (fit).
	 */
	function admit(blocks: (Block & { md?: string })[]): Block[] {
		const has = new Set(value.filter((b) => b.type === 'plugin').map((b) => b.plugin));
		const offered = plugins.filter((p) => allowed.has(p.type));
		return fit(
			blocks.flatMap(({ md, ...b }): Block[] => {
				if (b.type !== 'plugin') return [b];
				const p = pluginOf(b.plugin);
				if (p && allowed.has(p.type) && !(p.unique && has.has(p.type))) {
					if (p.unique) has.add(p.type);
					return [b];
				}
				return fromMarkdown(md ?? toMarkdown([b], { plugins }), { plugins: offered }).map((x) => ({ ...x, indent: Math.min(MAX_INDENT, x.indent + b.indent) }));
			})
		);
	}

	function onPaste(e: ClipboardEvent, b: Block) {
		const own = b.type === 'code' ? null : fromClip(e.clipboardData?.getData(CLIP));
		const text = e.clipboardData?.getData('text/plain');
		if (!own && text == null) return;
		e.preventDefault();
		const ce = e.currentTarget as HTMLElement;
		const norm = (text ?? '').replace(/\r/g, '');

		if (!own && (b.type === 'code' || !norm.includes('\n'))) {
			norm.split('\n').forEach((line, n) => {
				if (n) document.execCommand('insertLineBreak');
				if (line) document.execCommand('insertText', false, line);
			});
			return;
		}
		// Our own blocks as they were; otherwise markdown (a GFM table goes to a plugin that takes tables, if offered).
		const parsed = own ? admit(own) : fit(fromMarkdown(norm, { plugins: plugins.filter((p) => allowed.has(p.type)) }));
		if (!parsed.length) return;
		const parts = splitAtCaret(ce);
		if (!parts) return;
		const pre = clean(parts[0]);
		const post = clean(parts[1]);
		const i = idx(b.id);

		// An empty block takes pasted plugin blocks or dividers in its place.
		if (!pre && !post && atomic(parsed[0])) {
			mutate(() => (value = [...value.slice(0, i), ...parsed, ...value.slice(i + 1)]));
			const last = parsed[parsed.length - 1];
			if (atomic(last)) selectOnly(last.id);
			else focusBlock(last.id, 'end');
			return;
		}
		let rest = parsed;
		const first = parsed[0];
		let curHtml = pre;
		if (!pre && first.type !== 'hr' && first.type !== 'plugin') {
			b.type = first.type;
			b.indent = first.indent;
			if (first.type === 'todo') b.checked = first.checked;
			if (first.props) b.props = first.props;
			else delete b.props;
			curHtml = first.html;
			rest = parsed.slice(1);
		} else if (first.type === 'p') {
			curHtml = pre + first.html;
			rest = parsed.slice(1);
		}
		// Text after the caret goes into the last pasted block, or a new paragraph after a pasted plugin block or divider.
		if (post && rest.length && atomic(rest[rest.length - 1])) rest = [...rest, newBlock('p', '')];
		const target = rest.length ? rest[rest.length - 1] : b;
		const off = textLen(target === b ? curHtml : target.html);
		mutate(() => {
			if (target === b) curHtml += post;
			else target.html += post;
			b.html = curHtml;
			value = [...value.slice(0, i + 1), ...rest, ...value.slice(i + 1)];
		});
		if (atomic(target)) selectOnly(target.id);
		else focusBlock(target.id, off);
	}

	/** Pasting while whole blocks are selected: the blocks go in after the selection. */
	function onRootPaste(e: ClipboardEvent) {
		if (e.target !== root || readonly || !selH) return;
		const own = fromClip(e.clipboardData?.getData(CLIP));
		const text = e.clipboardData?.getData('text/plain') ?? '';
		const parsed = own ? admit(own) : fit(fromMarkdown(text.replace(/\r/g, ''), { plugins: plugins.filter((p) => allowed.has(p.type)) }));
		e.preventDefault();
		if (!parsed.length) return;
		const at = Math.max(...value.map((b, n) => (selSet.has(b.id) ? n : -1))) + 1;
		mutate(() => (value = [...value.slice(0, at), ...parsed, ...value.slice(at)]));
		selA = parsed[0].id;
		selH = parsed[parsed.length - 1].id;
	}

	/* ---------------------------------------------------------- inline format */

	function fmt(cmd: Cmd) {
		const ce = focusedId ? el(focusedId) : null;
		const b = focusedId ? value[idx(focusedId)] : null;
		if (!ce || !b) return;
		typed();
		if (cmd === 'code') toggleCode(ce);
		else if (cmd === 'plain') plainText(ce);
		else if (cmd === 'link') {
			const sel = getSelection()!;
			if (!sel.rangeCount) return;
			return void askLink(ce, b, sel.getRangeAt(0).cloneRange());
		} else document.execCommand(cmd);
		b.html = ce.innerHTML;
	}

	/** The link field below the selection; the selection is put back before the link is set (or removed with ''). */
	async function askLink(ce: HTMLElement, b: Block, saved: Range) {
		const r = saved.getBoundingClientRect();
		const node = saved.commonAncestorContainer;
		const href = (node instanceof Element ? node : node.parentElement)?.closest('a')?.getAttribute('href') ?? '';
		const url: string | undefined = await popups.open.component(LinkPrompt, { href, tr }, { pos: { clientX: r.left, clientY: r.bottom } });
		if (url === undefined) return;
		ce.focus({ preventScroll: true });
		const sel = getSelection()!;
		sel.removeAllRanges();
		sel.addRange(saved);
		typed();
		if (url === '') document.execCommand('unlink');
		else document.execCommand('createLink', false, /^(https?:|mailto:|tel:|\/(?!\/))/.test(url) ? url : 'https://' + url);
		b.html = ce.innerHTML;
	}

	function onSelChange() {
		if (slash) {
			const e = el(slash.id);
			const b = value[idx(slash.id)];
			if (e && b) detectSlash(e, b);
			else slash = null;
		}
		const sel = getSelection();
		if (readonly || !sel || sel.isCollapsed || !sel.rangeCount) return void (toolbar = null);
		const r = sel.getRangeAt(0);
		const a = r.commonAncestorContainer;
		const host = (a instanceof Element ? a : a.parentElement)?.closest('.ce');
		if (!host || host.closest('.editor') !== root) return void (toolbar = null);
		const rect = r.getBoundingClientRect();
		toolbar = { x: rect.left + rect.width / 2, y: rect.top };
	}

	/* --------------------------------------------------------- block selection */

	function blurActive() {
		(document.activeElement as HTMLElement | null)?.blur?.();
	}
	function selectOnly(id: string) {
		selA = selH = id;
		slash = null;
		blurActive();
		root.focus({ preventScroll: true });
		root.querySelector(`[data-block="${id}"]`)?.scrollIntoView({ block: 'nearest' });
	}

	function deleteSelected() {
		const ids = new Set(selSet);
		if (!ids.size) return;
		const first = value.findIndex((b) => ids.has(b.id));
		mutate(() => {
			let rest = value.filter((b) => !ids.has(b.id));
			if (!rest.length) rest = [newBlock()];
			value = rest;
		});
		selA = selH = null;
		const t = value[first - 1] ?? value[0];
		if (atomic(t)) selectOnly(t.id);
		else focusBlock(t.id, first > 0 ? 'end' : 'start');
	}

	/** The bubble's delete: the whole block selection if this block is in it, otherwise just this block. */
	function deleteBlock(b: Block) {
		if (!selSet.has(b.id)) selectOnly(b.id);
		deleteSelected();
	}

	function nudge(ids: string[], dir: -1 | 1) {
		const pos = value.map((b, i) => (ids.includes(b.id) ? i : -1)).filter((i) => i >= 0);
		if (!pos.length) return;
		const lo = pos[0];
		const hi = pos[pos.length - 1];
		if ((dir < 0 && lo === 0) || (dir > 0 && hi === value.length - 1)) return;
		const fid = focusedId;
		const fe = fid ? el(fid) : null;
		const off = fe ? caretOffset(fe) : 0;
		mutate(() => {
			const arr = [...value];
			const seg = arr.splice(lo, hi - lo + 1);
			arr.splice(lo + dir, 0, ...seg);
			value = arr;
		});
		if (fid) focusBlock(fid, off);
	}

	function onRootKey(e: KeyboardEvent) {
		// Undo and redo pressed inside a plugin's own field (a table cell): this editor's history, not the field's
		// native one (which the next re-render would lose anyway). A nested editor handles its own and prevents this.
		const mod0 = e.metaKey || e.ctrlKey;
		const k0 = e.key.toLowerCase();
		if (mod0 && (k0 === 'z' || k0 === 'y') && !e.defaultPrevented && e.target !== root && !(e.target as Element).closest?.('.ce')) {
			e.preventDefault();
			if (k0 === 'y' || e.shiftKey) redo();
			else undo();
			return;
		}
		if (e.target !== root || !selSet.size || !selH) return;
		if (onTurnKey(e)) return;
		const mod = e.metaKey || e.ctrlKey;
		const key = e.key;
		const h = idx(selH);
		if (key === 'ArrowUp' || key === 'ArrowDown') {
			e.preventDefault();
			const d = key === 'ArrowUp' ? -1 : 1;
			if (mod && e.shiftKey) return nudge([...selSet], d);
			const n = Math.max(0, Math.min(value.length - 1, h + d));
			selH = value[n].id;
			if (!e.shiftKey) selA = selH;
			root.querySelector(`[data-block="${selH}"]`)?.scrollIntoView({ block: 'nearest' });
		} else if (key === 'Backspace' || key === 'Delete') {
			e.preventDefault();
			deleteSelected();
		} else if (key === 'Enter') {
			e.preventDefault();
			const b = value[h];
			selA = selH = null;
			if (el(b.id)) focusBlock(b.id, 'end');
			else {
				const nb = newBlock();
				mutate(() => (value = [...value.slice(0, h + 1), nb, ...value.slice(h + 1)]));
				focusBlock(nb.id, 'start');
			}
		} else if (key === 'Escape') {
			const b = value[h];
			selA = selH = null;
			if (el(b.id)) focusBlock(b.id, 'end');
		} else if (mod && key.toLowerCase() === 'a') {
			e.preventDefault();
			selA = value[0].id;
			selH = value[value.length - 1].id;
		} else if (mod && key.toLowerCase() === 'z') {
			e.preventDefault();
			if (e.shiftKey) redo();
			else undo();
		} else if (mod && key.toLowerCase() === 'y') {
			e.preventDefault();
			redo();
		}
	}

	function onCopy(e: ClipboardEvent, cut = false) {
		if (!selSet.size) return;
		e.preventDefault();
		const blocks = value.filter((b) => selSet.has(b.id));
		e.clipboardData?.setData('text/plain', toMarkdown(blocks, { plugins }));
		// The blocks as they are, for pasting into this or another editor (the markdown is for everything else).
		e.clipboardData?.setData(
			CLIP,
			JSON.stringify({ v: 1, blocks: blocks.map((b) => $state.snapshot(toStored(b))), md: blocks.map((b) => toMarkdown([b], { plugins })) })
		);
		if (cut) deleteSelected();
	}

	/** A click on the handle selects the block (shift: extends the selection); the menu comes from the bubble (openTurn). */
	function onHandleClick(e: MouseEvent, b: Block, menu = false) {
		if (e.shiftKey && selA) {
			selH = b.id;
			blurActive();
			root.focus({ preventScroll: true });
			return;
		}
		// Clicking inside a block selection keeps it, so the menu acts on all of those blocks.
		if (selSet.has(b.id)) {
			blurActive();
			root.focus({ preventScroll: true });
		} else selectOnly(b.id);
		if (!menu) return;
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const up = r.bottom + 340 > innerHeight && r.top > 340;
		turn = { x: Math.min(r.right + 6, innerWidth - 250), y: up ? r.bottom : r.top, up, index: 0 };
	}

	/* ------------------------------------------------------ properties panel */

	// Plugin blocks and code blocks show their tag and fields on their top (PropsBar); read-only, a code block shows its
	// language in its corner.
	// Free text, or a dropdown when the host gives a list (provideCodeLanguages). A stored language missing from the
	// list stays an option, so opening an older document loses nothing.
	const codeLanguages = useCodeLanguages();
	const codeFields = (b: Block): PropField[] => {
		const list = codeLanguages();
		if (!list.length)
			// Only characters an opening fence can carry (```c++, ```objective-c).
			return [{ key: 'lang', label: 'Language', kind: 'text', placeholder: 'e.g. ts, py, css', parse: (s) => s.replace(/[^\w+#.-]/g, '') }];
		const lang = typeof b.props?.lang === 'string' ? b.props.lang : '';
		const options = [{ value: '', label: 'None' }, ...list.map((l) => ({ value: l.value, label: l.label ?? l.value }))];
		if (lang && !list.some((l) => l.value === lang)) options.push({ value: lang, label: lang });
		return [{ key: 'lang', label: 'Language', kind: 'select', options }];
	};
	const codeTag = (b: Block) => [tr('code'), b.props?.lang].filter(Boolean).join(' · ');
	function tagOf(b: Block) {
		const p = pluginOf(b.plugin);
		return p ? p.tag(b.props ?? {}).split(' · ').map((s) => tr(s)).join(' · ') : (b.plugin ?? '');
	}

	const fieldText = (b: Block, f: PropField) => {
		const v = b.props?.[f.key];
		return f.format ? f.format(v) : v == null ? '' : String(v);
	};

	/**
	 * A change from a plugin's view (a table cell, a nested editor): an undo step like typing, but only when the value
	 * really differs (a nested editor writes its document back when it mounts).
	 */
	function pluginChange(b: Block, key: 'props' | 'blocks', v: Block['props'] | StoredBlock[]) {
		if (JSON.stringify(v) === JSON.stringify(b[key])) return;
		typed();
		if (key === 'props') b.props = v as Block['props'];
		else b.blocks = v as StoredBlock[];
	}

	/** Sets one property to a value as it is ('' or undefined removes it). */
	function setValue(b: Block, key: string, v: unknown) {
		typed();
		const next = { ...(b.props ?? {}) };
		if (v === '' || v == null) delete next[key];
		else next[key] = v;
		b.props = next;
	}
	/** Sets one property from its field's text ('' removes it) and returns the text as it is now kept. */
	function setProp(b: Block, f: PropField, raw: string) {
		const v = f.parse ? f.parse(raw) : raw;
		typed();
		const next = { ...(b.props ?? {}) };
		if (v === '' || v == null) delete next[f.key];
		else next[f.key] = v;
		b.props = next;
		return fieldText(b, f);
	}

	/* --------------------------------------------------------- turn-into menu */

	// Opened from the handle. What a block can turn into depends on what it holds (see Content):
	//  - text <-> text keeps the formatting; text -> plain (code) keeps only the letters; plain -> text as is;
	//  - a type without content (divider, map, image) only replaces empty blocks or other contentless ones;
	//  - a type with nested blocks (box) wraps the selected blocks; "Unwrap" moves a box's blocks out;
	//  - a box can become another box-like type with its blocks; same-named props carry over.
	type TurnOption =
		| { kind: 'type'; item: PaletteItem; type: BlockType; current: boolean; lossy: boolean }
		| { kind: 'wrap'; item: PaletteItem; plugin: BlockPlugin; current: boolean }
		| { kind: 'retype'; item: PaletteItem; plugin: BlockPlugin; current: boolean }
		| { kind: 'unwrap' }
		| { kind: 'delete' };

	let turn = $state<{ x: number; y: number; up: boolean; index: number } | null>(null);

	/** Null for an unknown plugin type: it can only be deleted. */
	const contentOf = (b: Block): Content | null =>
		b.type === 'plugin' ? (pluginOf(b.plugin)?.content ?? null) : BUILT_IN_CONTENT[b.type];
	const emptyOrNone = (b: Block) => contentOf(b) === 'none' || ((contentOf(b) === 'text' || contentOf(b) === 'plain') && !b.html);
	const formatted = (html: string) => /<(?!br\b)[a-z]/i.test(html);

	const selected = $derived(value.filter((b) => selSet.has(b.id)));
	/** A block's palette id (as stored: 'md:p', or the plugin's type). */
	const paletteId = (b: Block) => (b.type === 'plugin' ? (b.plugin ?? '') : MD + b.type);

	const turnOptions = $derived.by((): TurnOption[] => {
		const sel = selected;
		if (!sel.length) return [];
		const kinds = sel.map(contentOf);
		const known = kinds.every((k) => k !== null);
		// No nested blocks among them: these can change type or be wrapped.
		const flat = known && kinds.every((k) => k !== 'blocks');
		const single = sel.length === 1 ? sel[0] : null;
		const out: TurnOption[] = [];
		for (const item of items) {
			const plugin = pluginOf(item.id);
			if (plugin) {
				const current = single?.plugin === plugin.type;
				if (plugin.content === 'blocks') {
					// only into a container that takes every block going in
					if (flat && sel.every((b) => acceptsId(plugin.accepts, paletteId(b)))) out.push({ kind: 'wrap', item, plugin, current: false });
					else if (single && kinds[0] === 'blocks' && (single.blocks ?? []).every((s) => acceptsId(plugin.accepts, s.type)))
						out.push({ kind: 'retype', item, plugin, current });
				} else if (plugin.content === 'none' && known && sel.every(emptyOrNone)) {
					out.push({ kind: 'retype', item, plugin, current });
				}
				continue;
			}
			const type = item.id.slice(MD.length) as BlockType;
			const to = BUILT_IN_CONTENT[type as Exclude<BlockType, 'plugin'>];
			if (!flat || (to === 'none' && !sel.every(emptyOrNone))) continue;
			const lossy = to === 'plain' && sel.some((b) => contentOf(b) === 'text' && formatted(b.html));
			out.push({ kind: 'type', item, type, current: single?.type === type, lossy });
		}
		if (known && kinds.includes('blocks')) out.push({ kind: 'unwrap' });
		out.push({ kind: 'delete' });
		return out;
	});

	$effect(() => {
		if (!selA) turn = null;
	});

	function applyTurn(n: number) {
		const opt = turnOptions[n];
		turn = null;
		if (!opt) return;
		const sel = selected;
		if (opt.kind === 'delete') return deleteSelected();
		if (opt.kind === 'unwrap') return unwrap(sel);
		if (opt.kind === 'wrap') return wrap(sel, opt.plugin);
		if (opt.kind === 'retype') return mutate(() => sel.forEach((b) => toPlugin(b, opt.plugin)));
		const type = opt.type;
		mutate(() => sel.forEach((b) => toBuiltIn(b, type)));
		if (sel.length === 1 && BUILT_IN_CONTENT[type as Exclude<BlockType, 'plugin'>] !== 'none') {
			selA = selH = null;
			focusBlock(sel[0].id, 'end');
		}
	}

	function toBuiltIn(b: Block, type: BlockType) {
		const from = contentOf(b);
		const to = BUILT_IN_CONTENT[type as Exclude<BlockType, 'plugin'>];
		if (from === 'text' && to === 'plain') b.html = plainHtml(b.html);
		if (from === 'none' || to === 'none') b.html = '';
		convert(b, type);
	}

	function toPlugin(b: Block, plugin: BlockPlugin) {
		const defaults = plugin.props();
		const old = b.type === 'plugin' ? (b.props ?? {}) : {};
		b.props = Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, k in old ? old[k] : v]));
		b.type = 'plugin';
		b.plugin = plugin.type;
		fresh.add(b.id);
		b.html = '';
		delete b.checked;
		if (plugin.content === 'blocks') b.blocks ??= [{ type: 'md:p', text: '', indent: 0 }];
		else delete b.blocks;
	}

	/** Puts the selected blocks, in order and with their relative indent, into one new block of `plugin`. */
	async function wrap(sel: Block[], plugin: BlockPlugin) {
		const base = Math.min(...sel.map((b) => b.indent));
		const blocks = sel.map((b) => ({ ...($state.snapshot(toStored(b)) as StoredBlock), indent: b.indent - base }));
		const pb = newBlock('plugin', '', { plugin: plugin.type, indent: base, props: plugin.props(), blocks });
		const at = idx(sel[0].id);
		const ids = new Set(sel.map((b) => b.id));
		mutate(() => {
			const rest = value.filter((b) => !ids.has(b.id));
			value = [...rest.slice(0, at), pb, ...rest.slice(at)];
		});
		await tick();
		selectOnly(pb.id);
	}

	/** Replaces each selected nested-block block with its inner blocks; the others stay. */
	function unwrap(sel: Block[]) {
		const ids = new Set(sel.filter((b) => contentOf(b) === 'blocks').map((b) => b.id));
		mutate(() => {
			const next = value.flatMap((b) => {
				if (!ids.has(b.id)) return [b];
				return fit((b.blocks ?? []).map(fromStored)).map((k) => {
					k.indent = Math.min(MAX_INDENT, k.indent + b.indent);
					return k;
				});
			});
			value = next.length ? next : [newBlock()];
		});
		selA = selH = null;
	}

	const optionKey = (o: TurnOption) => ('item' in o ? o.kind + ':' + o.item.id : o.kind);
	function optionView(o: TurnOption): { icon: Icon; label: string; hint: string } {
		const n = selected.length;
		if (o.kind === 'delete') return { icon: Trash2, label: tr('Delete'), hint: n > 1 ? tr('{n} blocks', { n }) : tr('Remove this block') };
		if (o.kind === 'unwrap') return { icon: Ungroup, label: tr('Unwrap'), hint: tr('Move the inner blocks out') };
		if (o.kind === 'wrap') return { icon: o.item.icon, label: o.item.label, hint: n > 1 ? tr('Put {n} blocks inside', { n }) : tr('Put inside') };
		if (o.kind === 'type' && o.lossy) return { icon: o.item.icon, label: o.item.label, hint: tr('Loses formatting') };
		return { icon: o.item.icon, label: o.item.label, hint: o.item.hint };
	}

	function onTurnKey(e: KeyboardEvent): boolean {
		if (!turn) return false;
		const turnCount = turnOptions.length;
		if (e.key === 'ArrowDown') turn.index = (turn.index + 1) % turnCount;
		else if (e.key === 'ArrowUp') turn.index = (turn.index - 1 + turnCount) % turnCount;
		else if (e.key === 'Enter') applyTurn(turn.index);
		else if (e.key === 'Escape') turn = null;
		else return false;
		e.preventDefault();
		return true;
	}

	/* ------------------------------------------------- selection across blocks */

	// A text selection dragged out of its block turns into a selection of whole blocks (each block is its own
	// editable field, so the browser cannot select text across them). Nested editors run the same logic, so a
	// sweep that leaves a box is taken over by the editor around it, with the box as one block.
	let sweeping = $state(false);
	let sweepFrom: Element | null = null;

	function startSweep(e: MouseEvent) {
		if (readonly || e.button !== 0 || e.shiftKey) return;
		const t = e.target as Element;
		if (!t.closest('.ce') || t.closest('.grab')) return;
		sweepFrom = t;
		addEventListener('mousemove', sweep);
		addEventListener('mouseup', endSweep, { once: true });
	}

	function sweep(e: MouseEvent) {
		const from = ownRow(sweepFrom);
		const here = document.elementFromPoint(e.clientX, e.clientY);
		if (!from || !here) return;
		const row = root.contains(here) ? ownRow(here) : null;
		// Left this editor, or came back to the starting block: back to plain text selection.
		if (!root.contains(here) || row === from) {
			if (sweeping) {
				sweeping = false;
				selA = selH = null;
			}
			return;
		}
		if (!row) return;
		if (!sweeping) {
			sweeping = true;
			blurActive();
			root.focus({ preventScroll: true });
		}
		getSelection()?.removeAllRanges();
		selA = from.dataset.block!;
		selH = row.dataset.block!;
	}

	function endSweep() {
		removeEventListener('mousemove', sweep);
		removeEventListener('mouseup', endSweep);
		sweepFrom = null;
		sweeping = false;
	}

	// Removed in the middle of a sweep or of typing: no listener or timer is left behind.
	onDestroy(() => {
		endSweep();
		clearTimeout(timer);
	});

	/* ---------------------------------------------------------------- dragging */

	function onDragStart(e: DragEvent, b: Block) {
		const ids = selSet.has(b.id) ? value.filter((x) => selSet.has(x.id)).map((x) => x.id) : [b.id];
		const moving = value.filter((x) => ids.includes(x.id));
		hub.src = {
			editor: token,
			ids,
			payload: moving.map((x) => $state.snapshot(toStored(x)) as StoredBlock),
			rows: ids.map((id) => root.querySelector<HTMLElement>(`[data-block="${id}"]`)!).filter(Boolean),
			remove: () => mutate(() => (value = value.filter((x) => !ids.includes(x.id)).concat(value.length === ids.length ? [newBlock()] : [])))
		};
		hub.target = null;
		if (!e.dataTransfer) return;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', ' ');
		const row = (e.currentTarget as HTMLElement).closest('.row');
		if (row) e.dataTransfer.setDragImage(row, 0, 0);
	}

	/** Can the dragged blocks land in this editor? Not inside themselves, and only plugins this editor offers. */
	function accepts(src: DragSource) {
		if (src.editor === token) return true;
		if (src.rows.some((r) => r.contains(root))) return false;
		return src.payload.every((s) => isMd(s) || (allowed.has(s.type) && !!pluginOf(s.type)));
	}

	function onDragOver(e: DragEvent) {
		// A nested editor deeper in the tree already took this event.
		if (!hub.src || e.defaultPrevented) return;
		const row = ownRow(e.target as Element);
		if (!row || !accepts(hub.src)) return;
		e.preventDefault();
		const r = row.getBoundingClientRect();
		hub.target = { editor: token, over: row.dataset.block!, after: e.clientY > r.top + r.height / 2 };
	}

	function onDrop(e: DragEvent) {
		const src = hub.src;
		const at = hub.target;
		if (!src || at?.editor !== token) return;
		e.preventDefault();
		hub.src = hub.target = null;
		const { over, after } = at;
		if (src.ids.includes(over)) return;
		if (src.editor === token) {
			mutate(() => {
				const moving = value.filter((b) => src.ids.includes(b.id));
				const rest = value.filter((b) => !src.ids.includes(b.id));
				const t = rest.findIndex((b) => b.id === over) + (after ? 1 : 0);
				value = [...rest.slice(0, t), ...moving, ...rest.slice(t)];
			});
			return;
		}
		// From another editor: copy in through the stored form, then remove at the source.
		const incoming = fit(src.payload.map(fromStored));
		mutate(() => {
			const t = idx(over) + (after ? 1 : 0);
			value = [...value.slice(0, t), ...incoming, ...value.slice(t)];
		});
		src.remove();
	}

	const dropMark = (id: string, after: boolean) =>
		hub.target?.editor === token && hub.target.over === id && hub.target.after === after && !hub.src?.ids.includes(id);

	/* ------------------------------------------------------------------- misc */

	/** The + button: a new paragraph below (or this one, if it is an empty paragraph) with the block menu open. */
	async function addBelow(b: Block) {
		let target = b;
		if (!(b.type === 'p' && !b.html)) {
			target = newBlock('p', '', { indent: b.indent });
			const i = idx(b.id);
			mutate(() => (value = [...value.slice(0, i + 1), target, ...value.slice(i + 1)]));
		}
		await tick();
		const ce = el(target.id);
		if (!ce) return;
		setCaret(ce, 'end');
		document.execCommand('insertText', false, '/');
	}

	function tailClick() {
		const l = value[value.length - 1];
		if (l.type === 'p' && !l.html) return void focusBlock(l.id);
		const nb = newBlock();
		mutate(() => (value = [...value, nb]));
		focusBlock(nb.id);
	}

	function toggleTodo(b: Block) {
		mutate(() => (b.checked = !b.checked));
	}
</script>

<svelte:document
	onselectionchange={onSelChange}
	onmousedown={(e) => {
		const t = e.target as Element;
		if (turn && !t.closest('.menu.turn') && !t.closest('.grab')) turn = null;
	}}
/>

<div
	class="editor"
	class:nested
	class:sweeping
	role="presentation"
	bind:this={root}
	tabindex="-1"
	onkeydown={onRootKey}
	oncopy={(e) => onCopy(e)}
	oncut={(e) => onCopy(e, true)}
	onpaste={onRootPaste}
	onmousedown={(e) => {
		if (selA && !(e.target as HTMLElement).closest('.grab')) selA = selH = null;
		startSweep(e);
	}}
	ondragover={onDragOver}
	ondrop={onDrop}
	ondragend={() => (hub.src = hub.target = null)}
>
	{#each value as b, i (b.id)}
		<div
			class="row"
			class:selected={selSet.has(b.id)}
			class:dragging={hub.src?.editor === token && hub.src.ids.includes(b.id)}
			class:drop-before={dropMark(b.id, false)}
			class:drop-after={dropMark(b.id, true)}
			data-block={b.id}
			data-type={b.type}
			style:--indent={b.indent}
		>
			{#if !readonly}
				<div class="gutter">
					<!-- The handle: a bar the full height of the block (so it shows what a drag moves), the grip icon in its
					     middle. Drag to move, click for the turn-into menu. Hovering it shows a small dark bubble on its right
					     with the block actions (add a block below, turn into, delete). -->
					<div class="grab">
						<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
						<span
							class="handle"
							draggable="true"
							title={tr('Drag to move, click to select')}
							ondragstart={(e) => onDragStart(e, b)}
							onclick={(e) => onHandleClick(e, b)}><span class="grip"><GripVertical size={16} /></span></span
						>
						<div class="bubble" role="toolbar" aria-label={tr('Block actions')}>
							<button
								type="button"
								title={tr('Add a block below')}
								aria-label={tr('Add a block below')}
								onmousedown={(e) => e.preventDefault()}
								onclick={() => addBelow(b)}><Plus size={15} /></button
							>
							<button
								type="button"
								title={tr('Turn into')}
								aria-label={tr('Turn into')}
								onmousedown={(e) => e.preventDefault()}
								onclick={(e) => onHandleClick(e, b, true)}><Replace size={15} /></button
							>
							<button
								type="button"
								class="del"
								title={tr('Delete')}
								aria-label={tr('Delete')}
								onmousedown={(e) => e.preventDefault()}
								onclick={() => deleteBlock(b)}><Trash2 size={15} /></button
							>
						</div>
					</div>
				</div>
			{/if}
			<div class="body t-{b.type}">
				{#if b.type === 'hr'}
					<hr />
				{:else if b.type === 'plugin'}
					{@const plugin = pluginOf(b.plugin)}
					{#if plugin}
						<div class="plugin">
							{#snippet propsBar()}
								<PropsBar block={b} tag={tagOf(b)} fields={plugin.fields ?? []} {tr} {setProp} {setValue} open={fresh.has(b.id)} />
							{/snippet}
							<PluginHost
								{plugin}
								bind:props={() => b.props ?? {}, (p) => pluginChange(b, 'props', p)}
								bind:blocks={() => b.blocks ?? [], (v) => pluginChange(b, 'blocks', v)}
								{readonly}
								{palette}
								{plugins}
								fields={!readonly && plugin.fields?.length ? propsBar : undefined}
							/>
						</div>
					{:else}
						<div class="unknown">{tr('Unknown block: {type}', { type: b.plugin ?? '' })}</div>
					{/if}
				{:else}
					{#if b.type === 'ul'}
						<span class="marker" aria-hidden="true">{['•', '◦', '▪'][b.indent % 3]}</span>
					{:else if b.type === 'ol'}
						<span class="marker num" aria-hidden="true">{nums[b.id]}.</span>
					{:else if b.type === 'todo'}
						<button
							type="button"
							class="check"
							class:done={b.checked}
							role="checkbox"
							aria-checked={!!b.checked}
							aria-label={tr('Done')}
							disabled={readonly}
							onmousedown={(e) => e.preventDefault()}
							onclick={() => toggleTodo(b)}
							>{#if b.checked}<Check size={12} strokeWidth={3} />{/if}</button
						>
					{:else if b.type === 'code' && !readonly}
						<div class="code-fields">
							<PropsBar block={b} tag={codeTag(b)} fields={codeFields(b)} {tr} {setProp} {setValue} />
						</div>
					{/if}
					<div
						class="ce"
						class:empty={!b.html}
						class:done={b.type === 'todo' && b.checked}
						role="textbox"
						aria-multiline="true"
						tabindex="0"
						contenteditable={readonly ? 'false' : 'true'}
						spellcheck={b.type !== 'code'}
						data-placeholder={hintFor(b.type)}
						use:rich={b.html}
						onkeydown={(e) => onKeydown(e, b)}
						onbeforeinput={onBeforeInput}
						oninput={(e) => onInput(e, b)}
						onpaste={(e) => onPaste(e, b)}
						onfocus={() => {
							focusedId = b.id;
							hub.active = token;
							selA = selH = null;
						}}
						onblur={() => {
							if (focusedId === b.id) focusedId = null;
							slash = null;
						}}
					></div>
				{/if}
				{#if b.type === 'code' && readonly}
					<!-- read-only: the language of a code block, in its corner -->
					<div class="badge">
						<span class="tag">{tr('code')}</span>
						{#if b.props?.lang}<span class="tag">{b.props.lang}</span>{/if}
					</div>
				{:else if b.type === 'plugin' && (readonly || !pluginOf(b.plugin)?.fields?.length)}
					<div class="badge"><span class="tag">{tagOf(b)}</span></div>
				{/if}
			</div>
		</div>
	{/each}

	{#if !readonly}
		<button type="button" class="tail" aria-label={tr('New block at the end')} onclick={tailClick}></button>
	{/if}

	{#if toolbar}
		<div class="toolbar" style:left="{toolbar.x}px" style:top="{toolbar.y}px" role="toolbar" aria-label={tr('Formatting')}>
			{#each tools as t (t.cmd)}
				<button
					type="button"
					title={tr(t.title)}
					aria-label={tr(t.title)}
					onmousedown={(e) => e.preventDefault()}
					onclick={() => fmt(t.cmd)}><t.icon size={16} /></button
				>
			{/each}
		</div>
	{/if}

	{#if turn}
		<div
			class="menu turn"
			class:up={turn.up}
			style:left="{turn.x}px"
			style:top="{turn.y}px"
			role="listbox"
			aria-label={tr('Turn into')}
		>
			{#if turnOptions[0]?.kind !== 'unwrap' && turnOptions[0]?.kind !== 'delete'}
				<div class="caption">{tr('Turn into')}</div>
			{/if}
			{#each turnOptions as o, n (optionKey(o))}
				{@const v = optionView(o)}
				{#if (o.kind === 'unwrap' || o.kind === 'delete') && n > 0 && turnOptions[n - 1].kind !== 'unwrap'}
					<div class="sep"></div>
				{/if}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="item"
					class:danger={o.kind === 'delete'}
					class:active={n === turn.index}
					role="option"
					tabindex="-1"
					aria-selected={n === turn.index}
					onmousedown={(e) => {
						e.preventDefault();
						applyTurn(n);
					}}
					onmouseenter={() => turn && (turn.index = n)}
				>
					<span class="icon"><v.icon size={14} /></span>
					<span class="txt"><b>{v.label}</b><small class:warn={'lossy' in o && o.lossy}>{v.hint}</small></span>
					{#if 'current' in o && o.current}<span class="current"><Check size={16} /></span>{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if slash && filtered.length}
		<div
			class="menu"
			class:up={slash.up}
			style:left="{slash.x}px"
			style:top="{slash.y}px"
			role="listbox"
			aria-label={tr('Block type')}
		>
			{#each filtered as it, n (it.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="item"
					class:active={n === slash.index}
					role="option"
					tabindex="-1"
					aria-selected={n === slash.index}
					onmousedown={(e) => {
						e.preventDefault();
						applySlash(it);
					}}
					onmouseenter={() => slash && (slash.index = n)}
				>
					<span class="icon"><it.icon size={14} /></span>
					<span class="txt"><b>{it.label}</b><small>{it.hint}</small></span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- the popups of this editor and the ones nested in it -->
{#if !nested}<PopupContainer />{/if}

<style>
	.editor {
		--fg: var(--color-surface-contrast, #1d1d1f);
		--muted: var(--color-muted-contrast, #a0a0a8);
		--accent: #3b82f6;
		--sel: rgba(59, 130, 246, 0.14);
		--surface: var(--color-surface, #fff);
		--border: var(--color-frame, #e5e5ea);
		--code-bg: rgba(120, 120, 140, 0.14);
		position: relative;
		outline: none;
		color: var(--fg);
		font: 17px/1.65 system-ui, -apple-system, 'Segoe UI', sans-serif;
		padding-bottom: 6rem;
	}
	/* While sweeping over whole blocks, the browser must not keep extending its own text selection. */
	.editor.sweeping,
	.editor.sweeping :global(*) {
		user-select: none;
	}
	.editor.nested {
		font-size: 1em;
		padding-bottom: 0;
	}
	.editor.nested > .tail {
		min-height: 0.75rem;
	}
	.plugin {
		flex: 1;
		min-width: 0;
		margin: 0.35em 0;
	}
	.unknown {
		flex: 1;
		padding: 0.6em 0.9em;
		border: 1px dashed var(--border);
		border-radius: 8px;
		color: var(--muted);
		font-size: 0.85em;
	}

	.row {
		position: relative;
		display: flex;
		border-radius: 6px;
		margin: 0 -8px;
		padding: 0 8px;
	}
	.row.selected {
		background: var(--sel);
	}
	.row.dragging {
		opacity: 0.35;
	}
	.row.drop-before::before,
	.row.drop-after::after {
		content: '';
		position: absolute;
		left: 8px;
		right: 8px;
		height: 3px;
		border-radius: 2px;
		background: var(--accent);
		z-index: 2;
	}
	.row.drop-before::before {
		top: -2px;
	}
	.row.drop-after::after {
		bottom: -2px;
	}

	/* 1px short at both ends, so the bars of neighbouring blocks do not touch. */
	.gutter {
		position: absolute;
		left: -22px;
		top: 1px;
		bottom: 1px;
		width: 20px;
	}
	.handle {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		color: var(--muted);
		border-radius: 4px;
		cursor: grab;
		transition:
			background 0.12s,
			box-shadow 0.12s;
	}
	/* The grip icon shows with the block's hover, caret or selection; the bubble comes only from the icon. */
	.grip {
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.12s;
	}
	/* The mouse: a faint fill with the block's hover, stronger on the bar (below; and while dragging). The block with
	   the typing caret (or the selected one): a thin frame instead (inset, so nothing moves). */
	.row:hover > .gutter .handle {
		background: rgba(120, 120, 140, 0.06);
	}
	.row:focus-within > .gutter .handle,
	.row.selected > .gutter .handle {
		box-shadow: inset 0 0 0 1px rgba(120, 120, 140, 0.22);
	}
	/* with the caret it breathes gently, like the caret blinks; only the innermost block (not the box around it) */
	.row:focus-within:not(:has(.row:focus-within)) > .gutter .handle {
		animation: caret-pulse 1.1s ease-in-out infinite alternate;
	}
	@keyframes caret-pulse {
		from {
			box-shadow: inset 0 0 0 1px rgba(120, 120, 140, 0.06);
		}
		to {
			box-shadow: inset 0 0 0 1px rgba(120, 120, 140, 0.3);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.row:focus-within:not(:has(.row:focus-within)) > .gutter .handle {
			animation: none;
		}
	}
	.row:hover > .gutter .grip,
	.row:focus-within > .gutter .grip,
	.row.selected > .gutter .grip {
		opacity: 1;
	}
	.row > .gutter .handle:hover,
	.row.dragging > .gutter .handle {
		background: var(--code-bg);
	}
	.grab {
		position: relative;
		height: 100%;
	}
	/* The block actions: a dark bubble right of the handle, over the start of the block. Its left padding bridges
	   the gap, so the pointer can move from the handle into it without it closing. */
	.bubble {
		position: absolute;
		left: 100%;
		top: 50%;
		z-index: 30;
		display: flex;
		padding-left: 6px;
		translate: 0 -50%;
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.12s,
			visibility 0s 0.12s;
	}
	.bubble::before {
		content: '';
		position: absolute;
		left: 2px;
		top: 50%;
		translate: 0 -50%;
		border: 4px solid transparent;
		border-right-color: var(--color-surface-contrast, #1d1d1f);
		border-left: 0;
	}
	.grab:has(.grip:hover) .bubble,
	.bubble:hover {
		opacity: 1;
		visibility: visible;
		transition-delay: 0.15s, 0s;
	}
	/* Hidden from the press on (so it is not in the drag image) and while sweeping. Only visibility changes here:
	   a layout change inside the row while the drag starts makes Chrome cancel the drag. */
	.handle:active ~ .bubble,
	.editor.sweeping .bubble {
		opacity: 0;
		visibility: hidden;
		transition: none;
	}
	.bubble button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 26px;
		padding: 0;
		border: 0;
		/* inverted: the theme's text colour as the background */
		color: var(--color-surface, #fff);
		background: var(--color-surface-contrast, #1d1d1f);
		cursor: pointer;
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.2);
	}
	.bubble button:first-child {
		border-radius: 6px 0 0 6px;
		padding-left: 2px;
	}
	.bubble button:last-child {
		border-radius: 0 6px 6px 0;
		padding-right: 2px;
	}
	.bubble button:hover {
		background: color-mix(in srgb, var(--color-surface-contrast, #1d1d1f) 82%, var(--color-surface, #fff));
	}
	.bubble button.del:hover {
		background: #c62828;
	}

	.body {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: flex-start;
		gap: 0.5em;
		padding: 0.15em 0;
		margin-left: calc(var(--indent, 0) * 1.7em);
	}

	.ce {
		flex: 1;
		min-width: 0;
		min-height: 1.65em;
		outline: none;
		white-space: pre-wrap;
		word-break: break-word;
		caret-color: var(--accent);
	}
	.ce.empty::before {
		content: attr(data-placeholder);
		color: var(--muted);
		pointer-events: none;
	}
	.t-p .ce.empty:not(:focus)::before,
	.t-ul .ce.empty:not(:focus)::before,
	.t-ol .ce.empty:not(:focus)::before {
		content: '';
	}
	.ce.done {
		color: var(--muted);
		text-decoration: line-through;
	}
	.ce :global(code) {
		background: var(--code-bg);
		padding: 0.1em 0.35em;
		border-radius: 4px;
		font: 0.88em ui-monospace, SFMono-Regular, Menlo, monospace;
	}
	.ce :global(a) {
		color: var(--accent);
		text-decoration: underline;
	}

	.t-h1 .ce {
		font-size: 2em;
		font-weight: 700;
		line-height: 1.25;
	}
	.t-h1 {
		padding-top: 0.6em;
	}
	.t-h2 .ce {
		font-size: 1.5em;
		font-weight: 650;
		line-height: 1.3;
	}
	.t-h2 {
		padding-top: 0.45em;
	}
	.t-h3 .ce {
		font-size: 1.2em;
		font-weight: 600;
		line-height: 1.4;
	}
	.t-h3 {
		padding-top: 0.3em;
	}
	.t-h4 .ce {
		font-size: 1.05em;
		font-weight: 600;
		line-height: 1.45;
	}
	.t-h4 {
		padding-top: 0.25em;
	}
	.t-h5 .ce {
		font-size: 0.95em;
		font-weight: 600;
		line-height: 1.5;
	}
	.t-h6 .ce {
		font-size: 0.85em;
		font-weight: 600;
		line-height: 1.5;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.t-h5,
	.t-h6 {
		padding-top: 0.2em;
	}
	.t-quote .ce {
		border-left: 3px solid var(--fg);
		padding-left: 0.9em;
		font-style: italic;
	}
	.t-code,
	.t-plugin {
		position: relative;
	}
	.badge {
		position: absolute;
		top: calc(0.15em + 5px);
		right: 6px;
		display: flex;
		align-items: center;
		gap: 2px;
		z-index: 2;
	}
	.t-plugin > .badge {
		top: calc(0.35em + 5px);
		/* Readable over a map or an image. */
		background: color-mix(in srgb, var(--color-surface, #fff) 92%, transparent);
		border-radius: 6px;
	}
	.tag {
		max-width: 18em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 1px 6px;
		border-radius: 5px;
		color: var(--muted);
		font: 500 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
		user-select: none;
	}
	/* the fields bar on its own row above the code */
	.t-code {
		flex-wrap: wrap;
		row-gap: 0;
	}
	.code-fields,
	.t-code .ce {
		flex-basis: 100%;
	}
	.t-code:has(> .badge) .ce {
		padding-right: 7.5em;
	}
	.t-code .ce {
		background: var(--code-bg);
		border-radius: 8px;
		padding: 0.7em 0.9em;
		font: 0.88em/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
		white-space: pre-wrap;
	}
	.t-hr {
		padding: 0.6em 0;
	}
	hr {
		flex: 1;
		border: 0;
		border-top: 1px solid var(--border);
		margin: 0;
	}

	.marker {
		flex: none;
		width: 1.3em;
		text-align: center;
		color: var(--fg);
		user-select: none;
	}
	.marker.num {
		width: 1.6em;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.check {
		flex: none;
		width: 1.1em;
		height: 1.1em;
		margin: 0.3em 0.2em 0 0.1em;
		border: 1.6px solid var(--muted);
		border-radius: 4px;
		background: transparent;
		color: #fff;
		display: grid;
		place-items: center;
		cursor: pointer;
		padding: 0;
	}
	.check.done {
		background: var(--accent);
		border-color: var(--accent);
	}

	.tail {
		display: block;
		width: 100%;
		min-height: 5rem;
		border: 0;
		background: none;
		cursor: text;
	}

	.toolbar {
		position: fixed;
		transform: translate(-50%, calc(-100% - 8px));
		display: flex;
		gap: 2px;
		padding: 4px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
		z-index: 20;
	}
	.toolbar button {
		min-width: 30px;
		height: 30px;
		border: 0;
		border-radius: 6px;
		background: none;
		color: var(--fg);
		display: grid;
		place-items: center;
		cursor: pointer;
	}
	.toolbar button:hover {
		background: var(--code-bg);
	}

	.menu {
		position: fixed;
		width: 260px;
		max-height: 300px;
		overflow: auto;
		padding: 6px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		box-shadow: 0 10px 36px rgba(0, 0, 0, 0.2);
		z-index: 30;
	}
	.menu.up {
		transform: translateY(-100%);
	}
	.menu.turn {
		width: 240px;
		max-height: 340px;
	}
	.caption {
		padding: 4px 8px 6px;
		font: 600 11px system-ui;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.sep {
		height: 1px;
		margin: 6px 4px;
		background: var(--border);
	}
	.current {
		margin-left: auto;
		display: flex;
		color: var(--accent);
	}
	.txt small.warn {
		color: #b45309;
	}
	.item.danger {
		color: #dc2626;
	}
	.item.danger .icon {
		color: #dc2626;
	}
	/* Compact one-line rows: icon, label, and the hint after it in grey. */
	.item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 3px 6px;
		border-radius: 6px;
		cursor: pointer;
	}
	.item.active {
		background: var(--sel);
	}
	.icon {
		flex: none;
		width: 24px;
		height: 24px;
		display: grid;
		place-items: center;
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--fg);
	}
	.txt {
		min-width: 0;
		display: flex;
		align-items: baseline;
		gap: 6px;
		white-space: nowrap;
		overflow: hidden;
	}
	.txt b {
		font: 500 13px system-ui;
	}
	.txt small {
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--muted);
		font-size: 11px;
	}
</style>
