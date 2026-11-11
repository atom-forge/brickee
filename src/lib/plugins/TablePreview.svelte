<svelte:options css="injected" />

<script lang="ts">
	import { inline } from '../markdown';
	import { useInlinePlugins } from '../inline-plugins';
	import type { PluginPreviewProps } from '../types';
	import { rowHead, square, tableHeads, type TableProps } from './Table.svelte';

	let { props }: PluginPreviewProps<TableProps> = $props();
	const inlinePlugins = useInlinePlugins();
	const rows = $derived(square(props.rows ?? []).filter((r) => r.some((c) => c.trim())));
	const heads = $derived(tableHeads(props));
	const align = (c: number) => (props.align?.[c] === 'center' || props.align?.[c] === 'right' ? props.align[c] : undefined);
</script>

{#if rows.length}
	<div class="wrap">
		<table>
			<tbody>
				{#each rows as row, r (r)}
					<tr>
						{#each row as cell, c (c)}
							{@const head = rowHead(heads, r, rows.length)}
							{#if head}
								<th class={head} scope={head === 'top' ? 'col' : undefined} style:text-align={align(c)}>{@html inline(cell, { inlinePlugins: inlinePlugins() })}</th>
							{:else}
								<td style:text-align={align(c)}>{@html inline(cell, { inlinePlugins: inlinePlugins() })}</td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style lang="scss">
	// The lines are drawn from the text colour, so the table fits any page.
	@function line($share) {
		@return color-mix(in srgb, currentColor $share, transparent);
	}

	// Wide tables scroll on their own instead of the page.
	.wrap {
		margin: 0 0 1em;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font: 15px/1.5 system-ui, sans-serif;
	}
	th,
	td {
		padding: 0.45em 0.7em;
		border-bottom: 1px solid line(15%);
		text-align: left;
		vertical-align: top;
	}
	th {
		font-weight: 600;

		&.top {
			border-bottom-width: 2px;
		}
		&.bottom {
			border-top: 2px solid line(22%);
		}
	}
</style>
