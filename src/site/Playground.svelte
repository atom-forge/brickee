<script lang="ts">
	// The home page's playground: the editor beside its output (preview, stored JSON or markdown).
	import { browser } from '$app/environment';
	import { Editor, Preview, fromStored, scrollSync, toMarkdown, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { Braces, Eye, FileText, RotateCcw } from '@lucide/svelte';
	import { welcome } from './samples';

	let value = $state<StoredBlock[]>(welcome());
	let output = $state<'preview' | 'json' | 'markdown'>('preview');

	const sync = scrollSync();
	const json = $derived(JSON.stringify(value, null, 2));
	// toMarkdown uses the DOM: browser only (the page is prerendered).
	const markdown = $derived(browser && output === 'markdown' ? toMarkdown(value.map(fromStored), { plugins: PLUGINS }) : '');

	const tabs = [
		{ key: 'preview', label: 'Preview', icon: Eye },
		{ key: 'json', label: 'Stored JSON', icon: Braces },
		{ key: 'markdown', label: 'Markdown', icon: FileText }
	] as const;
</script>

<div class="grid gap-4 lg:grid-cols-2">
	<section class="flex min-w-0 flex-col rounded-xl border border-frame bg-surface">
		<header class="flex items-center gap-2 border-b border-frame px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-contrast">
			Editor
			<button class="ml-auto flex items-center gap-1 rounded-md px-2 py-1 normal-case tracking-normal hover:bg-secondary" onclick={() => (value = welcome())}>
				<RotateCcw size={13} /> Reset
			</button>
		</header>
		<div class="h-[32rem] overflow-y-auto py-4 pr-4 pl-8" use:sync.source>
			<Editor bind:value plugins={PLUGINS} />
		</div>
	</section>

	<section class="flex min-w-0 flex-col rounded-xl border border-frame bg-surface">
		<header class="flex items-center gap-1 border-b border-frame px-2 py-1">
			{#each tabs as tab (tab.key)}
				<button
					class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors {output === tab.key ? 'bg-accent/10 text-accent' : 'text-muted-contrast hover:bg-secondary'}"
					onclick={() => (output = tab.key)}
				>
					<tab.icon size={13} /> {tab.label}
				</button>
			{/each}
		</header>
		<div class="h-[32rem] overflow-y-auto p-4" use:sync.target={output === 'preview'}>
			{#if output === 'preview'}
				<div class="prose prose-stone max-w-none dark:prose-invert">
					<Preview blocks={value} plugins={PLUGINS} />
				</div>
			{:else}
				<pre class="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-canvas-contrast">{output === 'json' ? json : markdown}</pre>
			{/if}
		</div>
	</section>
</div>
