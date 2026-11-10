<!-- The fields of a plugin block (or a code block), on the top of its box. Closed: only a small header (the block's
     tag); a click on it opens the fields in place: a wrapping row (label and control side by side), text areas on their
     own full-width rows. -->
<script lang="ts">
	import { ColorPicker, Input, NativeSelect, Slider, Textarea } from '@atom-forge/ui';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { slide } from 'svelte/transition';
	import { useView } from './view';
	import type { Translate } from './i18n';
	import type { Block, PropField } from './types';

	interface Props {
		block: Block;
		tag: string;
		fields: PropField[];
		tr: Translate;
		/** Sets one property from its field's text and returns the text as it is now kept. */
		setProp: (b: Block, f: PropField, raw: string) => string;
		/** Sets one property to a value as it is ('' or undefined removes it). */
		setValue: (b: Block, key: string, v: unknown) => void;
		/** Start with the fields open (a block just made). */
		open?: boolean;
	}
	let { block, tag, fields, tr, setProp, setValue, open: startOpen = false }: Props = $props();
	// svelte-ignore state_referenced_locally
	let open = $state(startOpen);

	const text = (f: PropField) => {
		const v = block.props?.[f.key];
		return f.format ? f.format(v) : v == null ? '' : String(v);
	};
	/** A text field's placeholder: its label, and its own placeholder (an example) after it. */
	const hint = (f: PropField) => [tr(f.label), f.placeholder && tr(f.placeholder)].filter(Boolean).join(' · ');
	/** Toggles: the values switched on, kept in the order of the options. */
	const toggled = (f: PropField): string[] => {
		const v = block.props?.[f.key];
		return Array.isArray(v) ? v.map(String) : [];
	};
	function toggle(f: PropField, value: string) {
		const on = new Set(toggled(f));
		if (!on.delete(value)) on.add(value);
		setValue(block, f.key, (f.options ?? []).map((o) => o.value).filter((x) => on.has(x)));
	}
	const optionLabel = (f: PropField, i: number) => {
		const opt = f.options?.[i];
		return opt ? tr(opt.label, { n: opt.value }) : '';
	};
	// Sliders: with `min`/`max` a free number (left of `min` a "none" notch that removes the value), otherwise the
	// index of one of the `options` (an unknown value: the first). With `views`, the slider edits the value of the view
	// the host gives (useView; none given: the base): a view without its own shows the one it takes (from the views
	// before it), and its notch means "take it".
	const free = (f: PropField) => f.min != null && f.max != null;
	const low = (f: PropField) => (f.none ? f.min! - Math.round((f.max! - f.min!) / 12) : f.min!);
	const view = useView();
	const viewOf = (f: PropField) => {
		const v = view();
		return f.views?.some((x) => x.key === v) ? v! : (f.views?.[0]?.key ?? '');
	};
	/** The view a per-view field edits, for its label (only when the host gives one). */
	const viewLabel = (f: PropField) => {
		const v = f.views && view() ? f.views.find((x) => x.key === viewOf(f)) : undefined;
		return v ? tr(v.label) : '';
	};
	const byView = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
	/** A view's own value (as text), '' when it has none. */
	const own = (f: PropField, view: string) => {
		const v = block.props?.[f.key];
		const raw = byView(v) ? v[view] : view === f.views?.[0]?.key ? v : undefined;
		return f.format ? f.format(raw) : raw == null ? '' : String(raw);
	};
	/** The text the picked view shows: its own, or the one it takes; and whether it is its own. */
	const current = (f: PropField): { text: string; mine: boolean } => {
		if (!f.views) return { text: text(f), mine: true };
		const keys = f.views.map((v) => v.key);
		const at = keys.indexOf(viewOf(f));
		for (let i = at; i >= 0; i--) {
			const t = own(f, keys[i]);
			if (t) return { text: t, mine: i === at };
		}
		return { text: '', mine: at === 0 };
	};
	const pos = (f: PropField) => {
		const t = current(f).text;
		if (!free(f)) return Math.max(0, (f.options ?? []).findIndex((o) => o.value === t));
		const n = Number(t);
		return t && Number.isFinite(n) ? Math.min(f.max!, Math.max(f.min!, n)) : low(f);
	};
	const setPos = (f: PropField, v: number) => {
		const t = free(f) ? (v < f.min! ? '' : String(Math.round(v))) : (f.options?.[v]?.value ?? '');
		if (!f.views) return setProp(block, f, t);
		// the views' own values, the picked one changed; only the base: stored alone
		const keys = f.views.map((x) => x.key);
		const next: Record<string, string> = {};
		for (const k of keys) {
			const value = k === viewOf(f) ? t : own(f, k);
			if (value) next[k] = value;
		}
		const set = Object.keys(next);
		setValue(block, f.key, !set.length ? '' : set.length === 1 && set[0] === keys[0] ? next[keys[0]] : next);
	};
	const posLabel = (f: PropField) => {
		const { text: t, mine } = current(f);
		const n = Number(t);
		const shown = !free(f) ? optionLabel(f, pos(f)) : t && Number.isFinite(n) ? `${Math.round(n)}${f.unit ?? ''}` : tr(f.none ?? '');
		return mine ? shown : `${shown} (${tr('inherited')})`;
	};

	// A text area keeps its text as typed while it has the focus (a list keeps its empty lines while typing); the block
	// gets the parsed value. Out of focus it shows the value as kept (so undo shows through).
	let editing = $state<{ key: string; text: string } | null>(null);

	const short = $derived(fields.filter((f) => f.kind !== 'textarea'));
	const long = $derived(fields.filter((f) => f.kind === 'textarea'));
</script>

<div class="bar" class:open>
	<button type="button" class="head" aria-expanded={open} title={tr(open ? 'Hide settings' : 'Settings')} onmousedown={(e) => e.preventDefault()} onclick={() => (open = !open)}>
		<span class="tag">{tag}</span>
		<ChevronDown size={13} class="chev" />
	</button>
	{#if open}
	<div class="body" transition:slide={{ duration: 180 }}>
	<div class="grid">
		{#each short as f (f.key)}
			{#if f.kind === 'text'}
				<!-- the field shows the value as kept (a YouTube link becomes its id); its label is the placeholder -->
				<label class="field" title={tr(f.label)}>
					<span class="sr">{tr(f.label)}</span>
					<Input small monospace placeholder={hint(f)} bind:value={() => text(f), (v: string) => setProp(block, f, v)} />
				</label>
			{:else}
			<!-- not a label around buttons (a slider's view buttons, a colour's clear, toggles): a click on a label goes to its first button -->
			<svelte:element this={f.kind === 'select' ? 'label' : 'div'} class="field inline" role={f.kind === 'toggles' ? 'group' : undefined} aria-label={f.kind === 'toggles' ? tr(f.label) : undefined}>
				<span class="name"
					>{tr(f.label)}{#if viewLabel(f)}<span class="view" class:own={current(f).mine}>{viewLabel(f)}</span>{/if}</span
				>
				{#if f.kind === 'select'}
					<NativeSelect
						small
						options={(f.options ?? []).map((opt) => ({ value: opt.value, label: tr(opt.label, { n: opt.value }) }))}
						bind:value={() => text(f), (v: string) => setProp(block, f, v)}
					/>
				{:else if f.kind === 'toggles'}
					{@const on = toggled(f)}
					<span class="toggles">
						{#each f.options ?? [] as opt (opt.value)}
							<button
								type="button"
								class="toggle"
								class:on={on.includes(opt.value)}
								aria-pressed={on.includes(opt.value)}
								title={tr(opt.label)}
								aria-label={tr(opt.label)}
								onmousedown={(e) => e.preventDefault()}
								onclick={() => toggle(f, opt.value)}
								>{#if opt.icon}<opt.icon size={15} />{:else}{tr(opt.label)}{/if}</button
							>
						{/each}
					</span>
				{:else if f.kind === 'slider'}
					<span class="line">
					<span class="slider">
						<Slider
							small
							drawStops={!free(f) && (f.options?.length ?? 0) <= 10}
							min={free(f) ? low(f) : 0}
							max={free(f) ? f.max : (f.options?.length ?? 1) - 1}
							step={free(f) ? (f.step ?? 1) : 1}
							bind:value={() => pos(f), (v: number) => setPos(f, v)}
						/>
					</span>
					<span class="value">{posLabel(f)}</span>
					</span>
				{:else if f.kind === 'color'}
					<!-- with `none`: an unset colour shows as "none" (a click sets one); a set one can be cleared -->
					<span class="line">
					{#if f.none && !text(f)}
						<button type="button" class="nocolor" onclick={() => setProp(block, f, f.placeholder || '#000000')}>
							<span class="swatch" aria-hidden="true"></span>{tr(f.none)}
						</button>
					{:else}
						<ColorPicker small bind:value={() => text(f) || '#000000', (v: string) => setProp(block, f, v)} />
						{#if f.none}
							<button type="button" class="clear" title={tr(f.none)} aria-label={tr(f.none)} onclick={() => setProp(block, f, '')}>×</button>
						{/if}
					{/if}
					</span>
				{/if}
			</svelte:element>
			{/if}
		{/each}
	{#each long as f (f.key)}
		<label class="field long" title={tr(f.label)} onfocusin={() => (editing = { key: f.key, text: text(f) })} onfocusout={() => (editing = null)}>
				<span class="sr">{tr(f.label)}</span>
				<Textarea
					small
					rows={2}
					placeholder={hint(f)}
					bind:value={() => (editing?.key === f.key ? editing.text : text(f)), (v: string) => {
						if (editing?.key === f.key) editing.text = v;
						setProp(block, f, v);
					}}
				/>
			</label>
	{/each}
	</div>
	</div>
	{/if}
</div>

<style>
	.bar {
		display: grid;
		justify-items: start;
		gap: 6px;
		margin-bottom: 4px;
		border-radius: 8px;
		font: 12px/1.4 system-ui, sans-serif;
		color: var(--color-surface-contrast, #1d1d1f);
	}
	.bar.open {
		justify-items: stretch;
		margin-bottom: 8px;
		padding: 6px 8px 8px;
		background: rgba(120, 120, 140, 0.07);
	}
	.bar {
		transition:
			padding 0.18s,
			background 0.18s;
	}
	/* the fields in columns as wide as the box allows; text fields carry their label as placeholder, the others a short
	   label beside the control */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 6px 10px;
		padding-top: 6px;
	}
	.head {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-muted-contrast, #8e8e96);
		cursor: pointer;
		justify-self: start;
	}
	.head:hover .tag {
		background: rgba(120, 120, 140, 0.2);
		color: var(--color-surface-contrast, #1d1d1f);
	}
	.head :global(.chev) {
		transition: rotate 0.15s;
	}
	.open .head :global(.chev) {
		rotate: 180deg;
	}
	.tag {
		padding: 1px 6px;
		border-radius: 5px;
		background: rgba(120, 120, 140, 0.12);
		color: var(--color-muted-contrast, #6e6e76);
		font: 500 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
		white-space: nowrap;
		user-select: none;
	}
	.field {
		display: grid;
		align-content: start;
		min-width: 0;
	}
	.field.inline {
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 8px;
	}
	/* compact controls: the bar's small type in the inputs too */
	.field :global(input:not([type='range'])),
	.field :global(textarea),
	.field :global(select) {
		font-size: 12px;
	}
	/* the label of a field whose placeholder shows it */
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
	.toggles {
		display: inline-flex;
		justify-self: start;
		gap: 1px;
		padding: 2px;
		border-radius: 7px;
		background: var(--color-muted, #f4f4f6);
	}
	.toggle {
		display: inline-grid;
		place-items: center;
		min-width: 26px;
		height: 24px;
		padding: 0 4px;
		border: 0;
		border-radius: 5px;
		background: none;
		color: var(--color-muted-contrast, #6e6e76);
		cursor: pointer;
	}
	.toggle:hover {
		color: var(--color-surface-contrast, #1d1d1f);
	}
	.toggle.on {
		background: var(--color-surface, #fff);
		color: #3b82f6;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
	}
	/* text areas take a whole row */
	.field.long {
		grid-column: 1 / -1;
	}
	.line {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}
	.name {
		font-size: 11.5px;
		font-weight: 600;
		color: var(--color-muted-contrast, #8e8e96);
		white-space: nowrap;
		user-select: none;
	}
	/* the view a per-view field edits (the host's current one); dashed while it only takes a wider view's value */
	.view {
		margin-left: 6px;
		padding: 0 5px;
		border: 1px dashed var(--color-frame, #c8c8d0);
		border-radius: 4px;
		color: var(--color-muted-contrast, #6e6e76);
		font-weight: 500;
	}
	.view.own {
		border-style: solid;
		border-color: var(--color-surface-contrast, #1d1d1f);
		color: var(--color-surface-contrast, #1d1d1f);
	}
	.slider {
		display: block;
		flex: 1;
		min-width: 80px;
	}
	.value {
		min-width: 4.5em;
		color: var(--color-surface-contrast, #3a3a40);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.nocolor {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 30px;
		padding: 0 10px 0 6px;
		border: 1px dashed var(--color-frame, #c8c8d0);
		border-radius: 7px;
		background: var(--color-surface, #fff);
		color: var(--color-muted-contrast, #8e8e96);
		cursor: pointer;
	}
	.nocolor:hover {
		border-color: var(--color-accent, #ea580c);
		color: var(--color-surface-contrast, #3a3a40);
	}
	/* an empty swatch, struck through */
	.swatch {
		width: 16px;
		height: 16px;
		border: 1px solid var(--color-frame, #c8c8d0);
		border-radius: 4px;
		background: linear-gradient(to top right, transparent calc(50% - 1px), #e5484d calc(50% - 1px), #e5484d calc(50% + 1px), transparent calc(50% + 1px));
	}
	.clear {
		width: 22px;
		height: 22px;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: none;
		color: var(--color-muted-contrast, #8e8e96);
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
	}
	.clear:hover {
		background: rgba(120, 120, 140, 0.14);
		color: var(--color-surface-contrast, #1d1d1f);
	}
</style>
