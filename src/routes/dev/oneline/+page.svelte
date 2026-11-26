<script lang="ts">
	// Development page (not linked from the site): one-line editors (`InlineEditor`), e.g. the answers of a quiz
	// question — for checking that Enter, Shift+Enter and a multi-line paste keep one line, that there are no handles or
	// block menus, and that marks and inline formulas work.
	import { InlineEditor } from '@atom-forge/brickee';
	import { inlineMath } from '@atom-forge/brickee/math';

	const answers = $state(['$\\mathcal{O}(n)$', '**bold** and `code`', '']);
	let entered = $state(0);
</script>

<div class="grid max-w-xl gap-2 p-6">
	{#each answers as _, i (i)}
		<div class="rounded-lg border border-frame px-2 py-1" data-testid="field-{i}">
			<InlineEditor bind:value={answers[i]} inlinePlugins={[inlineMath]} placeholder="Answer" onenter={() => entered++} />
		</div>
	{/each}
	<pre data-testid="values">{JSON.stringify(answers)}</pre>
	<span>enter: <span data-testid="entered">{entered}</span></span>
</div>
