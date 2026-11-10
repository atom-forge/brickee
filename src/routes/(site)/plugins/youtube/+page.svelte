<script lang="ts">
	import { DocInlineCode } from '@atom-forge/ui';
	import PluginDoc from '$site/PluginDoc.svelte';
	import Example from './examples/Example.svelte';
	import code from './examples/Example.svelte?raw';
</script>

<PluginDoc title="YouTube" name="youtube" type="youtube" example={Example} {code} markdown="a link to the video, titled."
	props={[
		{ name: 'id', type: 'string', description: 'The video id; any YouTube link pasted into the field is reduced to it (<code>youtubeId</code>).' },
		{ name: 'title', type: 'string', description: 'The video title, for the link text and the player.' }
	]}>
	A YouTube video. The preview shows a poster and loads the player only on click, so a page with videos stays light.
	<DocInlineCode>youtubeId(link)</DocInlineCode> is exported for your own preview.
</PluginDoc>
