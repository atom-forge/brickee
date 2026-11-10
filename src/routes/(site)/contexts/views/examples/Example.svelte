<script lang="ts">
	import { Editor, Preview, provideView, type StoredBlock } from '@atom-forge/brickee';
	import { gap } from '@atom-forge/brickee/plugins';
	import { photo } from '$site/blocks/photo';
	import { VIEWS, perView } from '$site/blocks/views';

	const plugins = [perView(photo, 'ratio'), perView(gap, 'lines')];
	let value = $state<StoredBlock[]>([
		{ type: 'photo', indent: 0, props: { image: 'sunrise', alt: '', ratio: { desktop: '40', phone: '100' } } },
		{ type: 'md:p', indent: 0, text: 'Switch the view, select the photo and move its height slider: each view keeps its own value, or inherits the one before it.' }
	]);

	let view = $state('desktop');
	// The host tells the editor which view its per-view fields edit.
	provideView(() => view);

	const widths: Record<string, string> = { desktop: '100%', tablet: '36rem', phone: '22rem' };
</script>

<div class="space-y-4">
	<div class="flex gap-1">
		{#each VIEWS as v (v.key)}
			<button class="rounded-md px-3 py-1.5 text-sm {view === v.key ? 'bg-accent text-accent-contrast' : 'bg-secondary'}" onclick={() => (view = v.key)}>{v.label}</button>
		{/each}
	</div>
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- pl-6: room for the block handles, drawn left of the editor -->
		<div class="pl-6"><Editor bind:value {plugins} /></div>
		<article class="prose prose-stone max-w-none dark:prose-invert mx-auto w-full transition-all" style:max-width={widths[view]}>
			<Preview blocks={value} {plugins} />
		</article>
	</div>
	<pre class="rounded-lg bg-secondary p-3 font-mono text-xs">ratio: {JSON.stringify(value[0]?.props?.ratio)}</pre>
</div>
