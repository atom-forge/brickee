<script lang="ts">
	import { Card } from '@atom-forge/ui';
	import { ArrowRight, Book } from '@lucide/svelte';
	import { NAV_GROUPS } from '$site/nav';
	import Playground from '$site/Playground.svelte';
</script>

<div class="space-y-8">
	<Card class="p-6 md:p-12 space-y-4 border-accent/20">
		<p class="text-accent text-xs font-bold uppercase tracking-[0.2em]">@atom-forge/brickee · Live examples</p>
		<h1 class="text-4xl md:text-5xl font-black tracking-tight text-canvas-contrast">Blocks in, JSON out.</h1>
		<p class="text-muted-contrast leading-relaxed max-w-3xl">
			Brickee is a Svelte 5 block editor. Its core is markdown — paragraphs, headings, lists, quotes, code — and every
			other block is a plugin with an editor view, a site preview and optionally a markdown form. Documents are stored
			as plain JSON. Try it below, or browse the guide. Search with <kbd>⌘K</kbd>.
		</p>
		<div class="flex flex-wrap gap-3">
			<a href="/guide/editor/" class="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 font-semibold text-accent-contrast no-underline hover:opacity-90"><Book size={18} /> Start the guide</a>
			<a href="https://books.atom-forge.eu/brickee/" class="inline-flex items-center gap-2 rounded-lg border border-frame px-5 py-3 font-semibold text-canvas-contrast no-underline hover:border-accent">Read the documentation <ArrowRight size={18} /></a>
		</div>
		<pre class="inline-block rounded-lg bg-secondary px-4 py-2 font-mono text-sm text-secondary-contrast">bun add @atom-forge/brickee @atom-forge/ui @lucide/svelte</pre>
	</Card>

	<section class="space-y-4">
		<h2 class="text-2xl font-bold text-canvas-contrast">Playground</h2>
		<p class="text-sm text-muted-contrast">Edit on the left; the right side shows the same document as the site renders it, as the JSON you store, or as markdown.</p>
		<Playground />
	</section>

	<section class="space-y-4">
		<h2 class="text-2xl font-bold text-canvas-contrast">Explore</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each NAV_GROUPS as group (group.key)}
				<a href={group.items[0].value + '/'} class="rounded-xl border border-frame bg-surface p-6 space-y-2 no-underline hover:border-accent transition-colors">
					<h3 class="flex items-center gap-2 text-lg font-semibold text-canvas-contrast"><group.icon size={18} class="text-accent" /> {group.label}</h3>
					<p class="text-sm text-muted-contrast">{group.description}</p>
					<p class="text-xs text-muted-contrast/70">{group.items.map((i) => i.label).join(' · ')}</p>
				</a>
			{/each}
		</div>
	</section>
</div>
