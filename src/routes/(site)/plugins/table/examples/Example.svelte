<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { table } from '@atom-forge/brickee/plugins';

	const plugins = [table];
	let value = $state<StoredBlock[]>([
		{ type: 'md:p', indent: 0, text: 'Click a cell to edit it; drag rows and columns by their grips.' },
		{
			type: 'table',
			indent: 0,
			props: {
				rows: [
					['Ticket', 'Price', 'Note'],
					['Adult', '€12', ''],
					['Student', '€8', 'with **valid ID**'],
					['Family', '€30', '2 adults + 2 kids'],
					['Total', '€50', '']
				],
				heads: ['top', 'bottom']
			}
		}
	]);
</script>

<div class="grid gap-6 md:grid-cols-2">
	<!-- pl-6: room for the block handles, drawn left of the editor -->
	<div class="pl-6"><Editor bind:value {plugins} /></div>
	<article class="prose prose-stone max-w-none dark:prose-invert">
		<Preview blocks={value} {plugins} />
	</article>
</div>
