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

<div
	data-fields
	class="grid gap-1.5 rounded-lg font-sans text-xs leading-[1.4] text-surface-contrast transition-[padding,background] duration-[180ms] {open
		? 'mb-2 justify-items-stretch bg-[rgb(120_120_140/0.07)] px-2 pt-1.5 pb-2'
		: 'mb-1 justify-items-start'}"
>
	<button type="button" data-fields-head class="group flex cursor-pointer items-center gap-0.5 justify-self-start border-0 bg-transparent p-0 text-muted-contrast" aria-expanded={open} title={tr(open ? 'Hide settings' : 'Settings')} onmousedown={(e) => e.preventDefault()} onclick={() => (open = !open)}>
		<span class="rounded-[5px] bg-[rgb(120_120_140/0.12)] px-1.5 py-px font-mono text-[11px] leading-[1.5] font-medium whitespace-nowrap text-muted-contrast select-none group-hover:bg-[rgb(120_120_140/0.2)] group-hover:text-surface-contrast">{tag}</span>
		<ChevronDown size={13} class="transition-[rotate] duration-150 {open ? 'rotate-180' : ''}" />
	</button>
	{#if open}
	<div transition:slide={{ duration: 180 }}>
	<!-- the fields in columns as wide as the box allows; text fields carry their label as placeholder, the others a short
	     label beside the control; the bar's small type in the controls too -->
	<div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-2.5 gap-y-1.5 pt-1.5 [&_input:not([type=range])]:text-[12px] [&_select]:text-[12px] [&_textarea]:text-[12px]">
		{#each short as f (f.key)}
			{#if f.kind === 'text'}
				<!-- the field shows the value as kept (a YouTube link becomes its id); its label is the placeholder -->
				<label class="grid min-w-0 content-start" title={tr(f.label)}>
					<span class="sr-only">{tr(f.label)}</span>
					<Input small monospace placeholder={hint(f)} bind:value={() => text(f), (v: string) => setProp(block, f, v)} />
				</label>
			{:else}
			<!-- not a label around buttons (a slider's view buttons, a colour's clear, toggles): a click on a label goes to its first button -->
			<svelte:element this={f.kind === 'select' ? 'label' : 'div'} class="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] content-start items-center gap-2" role={f.kind === 'toggles' ? 'group' : undefined} aria-label={f.kind === 'toggles' ? tr(f.label) : undefined}>
				<span class="text-[11.5px] font-semibold whitespace-nowrap text-muted-contrast select-none"
					>{tr(f.label)}{#if viewLabel(f)}<!-- the view a per-view field edits; dashed while it only takes a wider view's value --><span
							class="ml-1.5 rounded border px-[5px] font-medium {current(f).mine ? 'border-solid border-surface-contrast text-surface-contrast' : 'border-dashed border-frame text-muted-contrast'}"
							>{viewLabel(f)}</span
						>{/if}</span
				>
				{#if f.kind === 'select'}
					<NativeSelect
						small
						options={(f.options ?? []).map((opt) => ({ value: opt.value, label: tr(opt.label, { n: opt.value }) }))}
						bind:value={() => text(f), (v: string) => setProp(block, f, v)}
					/>
				{:else if f.kind === 'toggles'}
					{@const on = toggled(f)}
					<span class="inline-flex gap-px justify-self-start rounded-[7px] bg-muted p-0.5">
						{#each f.options ?? [] as opt (opt.value)}
							<button
								type="button"
								class="inline-grid h-6 min-w-[26px] cursor-pointer place-items-center rounded-[5px] border-0 px-1 {on.includes(opt.value)
									? 'bg-surface text-[#3b82f6] shadow-[0_1px_2px_rgb(0_0_0/0.08)]'
									: 'bg-transparent text-muted-contrast hover:text-surface-contrast'}"
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
					<span class="flex min-w-0 items-center gap-2">
					<span class="block min-w-20 flex-1">
						<Slider
							small
							drawStops={!free(f) && (f.options?.length ?? 0) <= 10}
							min={free(f) ? low(f) : 0}
							max={free(f) ? f.max : (f.options?.length ?? 1) - 1}
							step={free(f) ? (f.step ?? 1) : 1}
							bind:value={() => pos(f), (v: number) => setPos(f, v)}
						/>
					</span>
					<span class="min-w-[4.5em] whitespace-nowrap text-surface-contrast tabular-nums">{posLabel(f)}</span>
					</span>
				{:else if f.kind === 'color'}
					<!-- with `none`: an unset colour shows as "none" (a click sets one); a set one can be cleared -->
					<span class="flex min-w-0 items-center gap-2">
					{#if f.none && !text(f)}
						<button type="button" class="flex h-[30px] cursor-pointer items-center gap-1.5 rounded-[7px] border border-dashed border-frame bg-surface pr-2.5 pl-1.5 text-muted-contrast hover:border-accent hover:text-surface-contrast" onclick={() => setProp(block, f, f.placeholder || '#000000')}>
							<!-- an empty swatch, struck through -->
							<span class="size-4 rounded border border-frame bg-[linear-gradient(to_top_right,transparent_calc(50%-1px),#e5484d_calc(50%-1px),#e5484d_calc(50%+1px),transparent_calc(50%+1px))]" aria-hidden="true"></span>{tr(f.none)}
						</button>
					{:else}
						<ColorPicker small bind:value={() => text(f) || '#000000', (v: string) => setProp(block, f, v)} />
						{#if f.none}
							<button type="button" class="size-[22px] cursor-pointer rounded-md border-0 bg-transparent p-0 text-base leading-none text-muted-contrast hover:bg-[rgb(120_120_140/0.14)] hover:text-surface-contrast" title={tr(f.none)} aria-label={tr(f.none)} onclick={() => setProp(block, f, '')}>×</button>
						{/if}
					{/if}
					</span>
				{/if}
			</svelte:element>
			{/if}
		{/each}
	{#each long as f (f.key)}
		<label class="col-span-full grid min-w-0 content-start" title={tr(f.label)} onfocusin={() => (editing = { key: f.key, text: text(f) })} onfocusout={() => (editing = null)}>
				<span class="sr-only">{tr(f.label)}</span>
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
