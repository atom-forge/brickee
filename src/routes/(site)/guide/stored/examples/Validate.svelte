<script lang="ts">
	import { blocksSchemaFor } from '@atom-forge/brickee/schema';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	// On the server: validate what the client saves. It checks the shape and `accepts`,
	// not unknown types, uniqueness or the contents of plugin props.
	const schema = blocksSchemaFor(PLUGINS);

	let input = $state(JSON.stringify([{ type: 'md:p', indent: 0, text: 'Hello' }, { type: 'map', indent: 0, props: { q: 'Pécs' } }], null, 2));

	const result = $derived.by(() => {
		try {
			const parsed = schema.safeParse(JSON.parse(input));
			return parsed.success ? { ok: true, text: `Valid: ${parsed.data.length} block(s)` } : { ok: false, text: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n') };
		} catch (e) {
			return { ok: false, text: `Not JSON: ${(e as Error).message}` };
		}
	});
</script>

<div class="space-y-4">
	<textarea bind:value={input} rows="10" class="w-full rounded-lg border border-frame bg-surface p-3 font-mono text-xs"></textarea>
	<pre class="whitespace-pre-wrap rounded-lg p-3 font-mono text-xs {result.ok ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'}">{result.text}</pre>
</div>
