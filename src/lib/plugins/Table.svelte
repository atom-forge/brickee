<script lang="ts" module>
	export type Align = 'left' | 'center' | 'right';

	export interface TableProps extends Record<string, unknown> {
		/** Rows of cells; every cell is inline markdown (**bold**, links…). */
		rows: string[][];
		/** The header (first row) and the footer (last row, e.g. sums). */
		heads?: Head[];
		/** Before `heads`: 'yes' when the first row is the header. */
		header?: 'yes' | 'no';
		/** Text alignment per column (missing: left). */
		align?: Align[];
	}

	export type Head = 'top' | 'bottom';
	export const HEADS: Head[] = ['top', 'bottom'];

	/** The header and footer rows of a table (an old table's header: 'yes' is the first row). */
	export function tableHeads(p: { heads?: unknown; header?: unknown }): Set<Head> {
		if (Array.isArray(p.heads)) return new Set(p.heads.filter((h): h is Head => HEADS.includes(h as Head)));
		return new Set(p.header === 'yes' ? ['top'] : []);
	}

	/** Whether row `r` is the header or the footer, or null. A one-row table has neither. */
	export function rowHead(heads: Set<Head>, r: number, height: number): Head | null {
		if (height < 2) return null;
		if (heads.has('top') && r === 0) return 'top';
		if (heads.has('bottom') && r === height - 1) return 'bottom';
		return null;
	}

	/** Moves item `from` to the slot before `slot` (0…length). */
	export function moveTo<T>(list: T[], from: number, slot: number): T[] {
		const out = [...list];
		const [item] = out.splice(from, 1);
		out.splice(slot > from ? slot - 1 : slot, 0, item);
		return out;
	}

	/** Every row as long as the longest one. */
	export const square = (rows: string[][]) => {
		const width = Math.max(1, ...rows.map((r) => r.length));
		return rows.map((r) => [...r, ...Array(width - r.length).fill('')]);
	};
</script>

<script lang="ts">
	import { useText } from '../i18n';
	import {
		BetweenHorizontalEnd,
		BetweenHorizontalStart,
		BetweenVerticalEnd,
		BetweenVerticalStart,
		Columns3,
		Rows3,
		GripHorizontal,
		GripVertical,
		Plus,
		TextAlignCenter,
		TextAlignEnd,
		TextAlignStart,
		Trash2
	} from '@lucide/svelte';
	import { tick } from 'svelte';
	import type { PluginViewProps } from '../types';

	let { props = $bindable(), readonly }: PluginViewProps<TableProps> = $props();
	const tr = useText();

	let root: HTMLDivElement;
	const rows = $derived(square(props.rows?.length ? props.rows : [['']]));
	const width = $derived(rows[0].length);
	const align = $derived(Array.from({ length: width }, (_, c) => props.align?.[c] ?? 'left'));
	/** The cell being edited: the toolbar acts on its row and column. */
	let at = $state<{ r: number; c: number } | null>(null);
	const heads = $derived(tableHeads(props));
	const headOf = (r: number) => rowHead(heads, r, rows.length);
	/* Dragging a row or a column by its grip: `to` is the slot it would go to (0…count), shown as a blue line. */
	let drag = $state<{ kind: 'row' | 'col'; from: number; to: number } | null>(null);

	function slotAt(kind: 'row' | 'col', e: PointerEvent) {
		const cells = [...root.querySelectorAll<HTMLElement>(kind === 'row' ? 'tr[data-r]' : 'td[data-grip-c]')];
		const i = cells.findIndex((el) => {
			const b = el.getBoundingClientRect();
			return kind === 'row' ? e.clientY < b.top + b.height / 2 : e.clientX < b.left + b.width / 2;
		});
		return i < 0 ? cells.length : i;
	}

	function startDrag(e: PointerEvent, kind: 'row' | 'col', from: number) {
		if (readonly || e.button !== 0) return;
		// not the editor's own block drag or selection
		e.preventDefault();
		e.stopPropagation();
		// the toolbar stays as it is while dragging (its height would shift the table under the pointer)
		drag = { kind, from, to: from };
		const move = (ev: PointerEvent) => drag && (drag.to = slotAt(kind, ev));
		const up = () => {
			removeEventListener('pointermove', move);
			removeEventListener('pointerup', up);
			const d = drag;
			drag = null;
			at = null;
			if (!d || d.to === d.from || d.to === d.from + 1) return;
			if (d.kind === 'row') setRows(moveTo(rows, d.from, d.to));
			else {
				setRows(rows.map((row) => moveTo(row, d.from, d.to)));
				set({ align: moveTo(align, d.from, d.to) });
			}
		};
		addEventListener('pointermove', move);
		addEventListener('pointerup', up);
		stopDrag = () => {
			removeEventListener('pointermove', move);
			removeEventListener('pointerup', up);
		};
	}
	// A table removed in the middle of a drag leaves no listener behind.
	let stopDrag = () => {};
	$effect(() => () => stopDrag());
	/** The drop line of a row or column: before it, after it (the last one), or none. */
	function dropMark(kind: 'row' | 'col', i: number, count: number) {
		if (drag?.kind !== kind || drag.to === drag.from || drag.to === drag.from + 1) return null;
		return drag.to === i ? 'before' : drag.to === count && i === count - 1 ? 'after' : null;
	}

	const set = (next: Partial<TableProps>) => (props = { ...props, ...next });
	const setRows = (next: string[][]) => set({ rows: next });

	async function focusCell(r: number, c: number, caret: 'start' | 'end' = 'end') {
		await tick();
		const cell = root.querySelector<HTMLTextAreaElement>(`textarea[data-cell="${r}:${c}"]`);
		if (!cell) return;
		cell.focus();
		const pos = caret === 'start' ? 0 : cell.value.length;
		cell.setSelectionRange(pos, pos);
	}

	const edit = (r: number, c: number, v: string) => setRows(rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));

	function insertRow(at: number) {
		setRows([...rows.slice(0, at), Array(width).fill(''), ...rows.slice(at)]);
	}
	function insertCol(at: number) {
		setRows(rows.map((row) => [...row.slice(0, at), '', ...row.slice(at)]));
		set({ align: [...align.slice(0, at), 'left', ...align.slice(at)] });
	}
	function dropRow(r: number) {
		if (rows.length > 1) setRows(rows.filter((_, i) => i !== r));
		at = null;
	}
	function dropCol(c: number) {
		if (width > 1) {
			setRows(rows.map((row) => row.filter((_, j) => j !== c)));
			set({ align: align.filter((_, j) => j !== c) });
		}
		at = null;
	}
	const setAlign = (c: number, a: Align) => set({ align: align.map((x, j) => (j === c ? a : x)) });

	function onKey(e: KeyboardEvent, r: number, c: number) {
		const t = e.currentTarget as HTMLTextAreaElement;
		const last = r === rows.length - 1;
		if (e.key === 'Enter' && !e.shiftKey) {
			// Enter goes down a row (a new one after the last); Shift+Enter breaks the line inside the cell.
			e.preventDefault();
			if (last) insertRow(rows.length);
			focusCell(r + 1, c);
		} else if (e.key === 'Tab' && !e.shiftKey && last && c === width - 1) {
			e.preventDefault();
			insertRow(rows.length);
			focusCell(r + 1, 0);
		} else if (e.key === 'ArrowUp' && r > 0 && !t.value.slice(0, t.selectionStart).includes('\n')) {
			e.preventDefault();
			focusCell(r - 1, c);
		} else if (e.key === 'ArrowDown' && !last && !t.value.slice(t.selectionEnd).includes('\n')) {
			e.preventDefault();
			focusCell(r + 1, c, 'start');
		}
	}

	/** Cells copied from a spreadsheet (tab-separated lines) fill the table from this cell on, growing it as needed. */
	function onPaste(e: ClipboardEvent, r: number, c: number) {
		const text = e.clipboardData?.getData('text/plain') ?? '';
		if (!text.includes('\t')) return;
		e.preventDefault();
		const grid = text.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((line) => line.split('\t'));
		const next = square(rows.map((row) => [...row]));
		const need = Math.max(width, c + Math.max(...grid.map((g) => g.length)));
		while (next.length < r + grid.length) next.push([]);
		grid.forEach((cells, i) => cells.forEach((v, j) => (next[r + i][c + j] = v.trim())));
		setRows(square(next.map((row) => [...row, ...Array(Math.max(0, need - row.length)).fill('')])));
		set({ align: Array.from({ length: need }, (_, j) => align[j] ?? 'left') });
	}

	// A cell is at least as tall as its text (min-height); the CSS stretches it to the tallest cell of its row. The text
	// parameter re-fits it when the text changes from outside (undo, a paste).
	function autosize(node: HTMLTextAreaElement, _text: string) {
		const fit = () => {
			node.style.height = '0';
			node.style.minHeight = `${node.scrollHeight}px`;
			node.style.height = '';
		};
		fit();
		node.addEventListener('input', fit);
		return { update: fit, destroy: () => node.removeEventListener('input', fit) };
	}

	// The toolbar's look (Tailwind; whole class names, so Tailwind finds them): segments of small buttons.
	const SEG = 'inline-flex items-center gap-px rounded-lg bg-muted p-0.5';
	const LABEL = 'inline-grid place-items-center pr-1 pl-[5px] text-muted-contrast';
	const TOOL =
		'inline-grid h-6 min-w-[26px] cursor-pointer place-items-center rounded-md border-0 bg-transparent px-[5px] text-surface-contrast enabled:hover:bg-surface enabled:hover:shadow-[0_1px_2px_rgb(0_0_0/0.08)] disabled:cursor-default disabled:opacity-30';
	const TOOL_ON =
		'inline-grid h-6 min-w-[26px] cursor-pointer place-items-center rounded-md border-0 bg-surface px-[5px] text-[#2563eb] shadow-[0_1px_2px_rgb(0_0_0/0.08)]';
	const DANGER = `${TOOL} enabled:hover:text-[#dc2626]`;
	const ADD = $derived(
		`grid cursor-pointer place-items-center rounded-md border-0 bg-muted p-0 text-muted-contrast transition-[opacity,background] duration-[120ms] hover:bg-[color-mix(in_srgb,#3b82f6_12%,transparent)] hover:text-[#2563eb] ${at ? 'opacity-100' : 'opacity-0 group-hover/table:opacity-100'}`
	);

	const ALIGNS: { value: Align; icon: typeof TextAlignStart; label: string }[] = [
		{ value: 'left', icon: TextAlignStart, label: 'Align column left' },
		{ value: 'center', icon: TextAlignCenter, label: 'Center column' },
		{ value: 'right', icon: TextAlignEnd, label: 'Align column right' }
	];
</script>

<div
	class="table-editor group/table font-[system-ui,-apple-system,'Segoe_UI',sans-serif] text-[15px] leading-[1.45]"
	bind:this={root}
	onfocusout={(e) => {
		if (!root.contains(e.relatedTarget as Node)) at = null;
	}}
>
	{#if !readonly}
		<!-- The row and column tools of the cell being edited; when it wraps, it pushes the table down. -->
		<div class="mb-2 flex min-h-7 flex-wrap items-center gap-1.5" role="toolbar" aria-label={tr('Table')}>
			{#if at}
				{@const { r, c } = at}
				<div class={SEG}>
					<span class={LABEL} title={tr('Row')}><Rows3 size={14} /></span>
					<button type="button" class={TOOL} title={tr('Insert a row above')} onmousedown={(e) => e.preventDefault()} onclick={() => { insertRow(r); focusCell(r, c); }}><BetweenHorizontalStart size={15} /></button>
					<button type="button" class={TOOL} title={tr('Insert a row below')} onmousedown={(e) => e.preventDefault()} onclick={() => { insertRow(r + 1); focusCell(r + 1, c); }}><BetweenHorizontalEnd size={15} /></button>
					<button type="button" class={DANGER} title={tr('Delete this row')} disabled={rows.length < 2} onclick={() => dropRow(r)}><Trash2 size={14} /></button>
				</div>
				<div class={SEG}>
					<span class={LABEL} title={tr('Column')}><Columns3 size={14} /></span>
					<button type="button" class={TOOL} title={tr('Insert a column left')} onmousedown={(e) => e.preventDefault()} onclick={() => { insertCol(c); focusCell(r, c); }}><BetweenVerticalStart size={15} /></button>
					<button type="button" class={TOOL} title={tr('Insert a column right')} onmousedown={(e) => e.preventDefault()} onclick={() => { insertCol(c + 1); focusCell(r, c + 1); }}><BetweenVerticalEnd size={15} /></button>
					<button type="button" class={DANGER} title={tr('Delete this column')} disabled={width < 2} onclick={() => dropCol(c)}><Trash2 size={14} /></button>
				</div>
				<div class={SEG}>
					{#each ALIGNS as a (a.value)}
						<button type="button" class={align[c] === a.value ? TOOL_ON : TOOL} title={tr(a.label)} onmousedown={(e) => e.preventDefault()} onclick={() => setAlign(c, a.value)}><a.icon size={15} /></button>
					{/each}
				</div>
			{:else}
				<span class="text-[12px] text-muted-contrast">{tr('Click a cell to edit its row and column')}</span>
			{/if}
		</div>
	{/if}
	<!-- The table, with a + bar on the right (column) and below (row) that shows on hover. -->
	<div class="grid grid-cols-[minmax(0,1fr)_18px] grid-rows-[auto_18px] gap-1">
		<div class="overflow-x-auto rounded-[10px] border border-frame bg-surface">
			<table class:dragging={!!drag}>
				{#if !readonly}
					<!-- the column grips -->
					<thead>
						<tr class="grips">
							<td class="corner"></td>
							{#each rows[0] as _, c (c)}
								<td data-grip-c={c} class="cgrip {dropMark('col', c, width) ?? ''}">
									<button type="button" class="grip" title={tr('Drag to move the column')} aria-label={tr('Drag to move the column')} onpointerdown={(e) => startDrag(e, 'col', c)} onmousedown={(e) => e.stopPropagation()}><GripHorizontal size={12} /></button>
								</td>
							{/each}
						</tr>
					</thead>
				{/if}
				<tbody>
					{#each rows as row, r (r)}
						<tr data-r={r} class="{dropMark('row', r, rows.length) ?? ''} h-{headOf(r) ?? 'none'}" class:row-on={at?.r === r} class:moving={drag?.kind === 'row' && drag.from === r}>
							{#if !readonly}
								<td class="rgrip">
									<button type="button" class="grip" title={tr('Drag to move the row')} aria-label={tr('Drag to move the row')} onpointerdown={(e) => startDrag(e, 'row', r)} onmousedown={(e) => e.stopPropagation()}><GripVertical size={12} /></button>
								</td>
							{/if}
							{#each row as cell, c (c)}
								<td
									class={dropMark('col', c, width) ? 'c-' + dropMark('col', c, width) : ''}
									class:col-on={at?.c === c}
									class:moving={drag?.kind === 'col' && drag.from === c}
								>
									<textarea
										rows="1"
										value={cell}
										{readonly}
										placeholder={headOf(r) ? tr('Heading') : ''}
										data-cell="{r}:{c}"
										style:text-align={align[c]}
										aria-label={tr('Row {r}, column {c}', { r: r + 1, c: c + 1 })}
										use:autosize={cell}
										onfocus={() => (at = { r, c })}
										oninput={(e) => edit(r, c, e.currentTarget.value)}
										onkeydown={(e) => onKey(e, r, c)}
										onpaste={(e) => onPaste(e, r, c)}
									></textarea>
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if !readonly}
			<button type="button" class={ADD} title={tr('Add a column')} aria-label={tr('Add a column')} onclick={() => { insertCol(width); focusCell(0, width); }}><Plus size={14} /></button>
			<button type="button" class="col-start-1 {ADD}" title={tr('Add a row')} aria-label={tr('Add a row')} onclick={() => { insertRow(rows.length); focusCell(rows.length, 0); }}><Plus size={14} /></button>
		{/if}
	</div>
</div>

<style lang="scss">
	// The grid itself: cells, header and footer bands, the focused cell, the grips and the drop lines.
	$accent: #3b82f6;

	table {
		width: 100%;
		border-collapse: collapse;

		&.dragging,
		&.dragging * {
			cursor: grabbing !important;
			user-select: none;
		}
	}

	// The 1px height lets the editor inside fill the whole cell (height: 100% of the row's tallest cell).
	td {
		height: 1px;
		padding: 0;
		border-right: 1px solid var(--color-frame, #ececf0);
		border-bottom: 1px solid var(--color-frame, #ececf0);
		vertical-align: top;
		transition: background 0.1s;

		&:last-child {
			border-right: 0;
		}
	}

	tr {
		&:last-child td {
			border-bottom: 0;
		}
		&.row-on td,
		td.col-on {
			background: color-mix(in srgb, $accent 4%, transparent);
		}
		// The header and the footer as on the site: a band above, the sums bold on grey behind a thicker line.
		&.h-top td:not(.rgrip) {
			background: var(--color-muted, #f1f1f4);
			border-bottom: 2px solid var(--color-frame, #d8d8de);
		}
		&.h-bottom td:not(.rgrip) {
			background: var(--color-muted, #f1f1f4);
			border-top: 2px solid var(--color-frame, #d8d8de);
		}
		&.h-top textarea {
			font-weight: 600;
			font-size: 13px;
			letter-spacing: 0.04em;
			text-transform: uppercase;
			color: var(--color-surface-contrast, #3a3a44);
		}
		&.h-bottom textarea {
			font-weight: 600;
			color: var(--color-surface-contrast, #1d1d1f);
		}
	}

	textarea {
		display: block;
		width: 100%;
		height: 100%;
		min-width: 6em;
		box-sizing: border-box;
		padding: 8px 11px;
		border: 0;
		border-radius: 0;
		background: none;
		resize: none;
		font: inherit;
		color: inherit;
		outline: none;

		&::placeholder {
			color: var(--color-muted-contrast, #b8b8c0);
		}
		&:focus {
			background: var(--color-surface, #fff);
			box-shadow: inset 0 0 0 2px $accent;
		}
	}

	// Grips: a thin row above the columns and a thin column before the rows, shown on hover.
	td.corner,
	td.rgrip {
		width: 14px;
		border-right: 1px solid var(--color-frame, #ececf0);
	}
	tr.grips td {
		height: 14px;
		border-bottom: 1px solid var(--color-frame, #ececf0);
	}
	.grip {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		min-height: 14px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-muted-contrast, #b0b0b8);
		cursor: grab;
		opacity: 0;
		touch-action: none;
		transition: opacity 0.12s;

		.table-editor:hover &,
		table.dragging & {
			opacity: 1;
		}
		&:hover {
			color: #2563eb;
			background: color-mix(in srgb, $accent 9%, transparent);
		}
	}

	.moving {
		opacity: 0.45;
	}

	// Drop lines while a row or a column is dragged.
	tr.before td {
		box-shadow: inset 0 2px 0 $accent;
	}
	tr.after td {
		box-shadow: inset 0 -2px 0 $accent;
	}
	td.before,
	td.c-before {
		box-shadow: inset 2px 0 0 $accent;
	}
	td.after,
	td.c-after {
		box-shadow: inset -2px 0 0 $accent;
	}
</style>
