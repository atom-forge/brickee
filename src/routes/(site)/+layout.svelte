<script lang="ts">
	import App from '$site/App.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const title = 'AtomForge Brickee — a Svelte 5 block editor';
	const description = 'Live examples of Brickee, the Svelte 5 block editor: markdown blocks plus plugins, stored as JSON.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
</svelte:head>

<App>
	<div class="max-w-5xl mx-auto pb-8">
		{@render children()}
	</div>
</App>
