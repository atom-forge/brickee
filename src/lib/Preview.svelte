<!-- Renders a document the way a site shows it. Styles travel with the markup (injected), so the preview looks the same
     wherever it is mounted. -->
<svelte:options css="injected" />

<script lang="ts" module>
	import { olStart, type StoredBlock } from './types';

	const LIST = new Set(['md:ul', 'md:ol', 'md:todo']);

	/** Consecutive list blocks as properly nested lists: an item one level deeper goes into the previous item. */
	export type ListNode = { type: string; items: { block: StoredBlock; children: ListNode[] }[] };
	export type Part = { kind: 'block'; block: StoredBlock } | { kind: 'lists'; lists: ListNode[] };

	function nest(run: StoredBlock[], i: number, level: number): [ListNode[], number] {
		const out: ListNode[] = [];
		let cur: ListNode | null = null;
		while (i < run.length && run[i].indent >= level) {
			const b = run[i];
			if (b.indent > level && cur) {
				const [kids, next] = nest(run, i, level + 1);
				cur.items[cur.items.length - 1].children.push(...kids);
				i = next;
				continue;
			}
			// A different list type at the same level starts a new list.
			if (!cur || cur.type !== b.type) out.push((cur = { type: b.type, items: [] }));
			cur.items.push({ block: b, children: [] });
			i++;
		}
		return [out, i];
	}

	export function parts(blocks: StoredBlock[]): Part[] {
		const out: Part[] = [];
		for (let i = 0; i < blocks.length; ) {
			if (!LIST.has(blocks[i].type)) {
				out.push({ kind: 'block', block: blocks[i++] });
				continue;
			}
			let j = i;
			while (j < blocks.length && LIST.has(blocks[j].type)) j++;
			const run = blocks.slice(i, j);
			out.push({ kind: 'lists', lists: nest(run, 0, Math.min(...run.map((b) => b.indent)))[0] });
			i = j;
		}
		return out;
	}
</script>

<script lang="ts">
	import { useText } from './i18n';
	import { inline } from './markdown';
	import { provideText, type Messages } from './i18n';
	import type { BlockPlugin } from './types';

	interface Props {
		blocks: StoredBlock[];
		plugins: BlockPlugin[];
		/** Set by plugins rendering their nested blocks (a container's preview). */
		nested?: boolean;
		/** UI text in the host's language; nested previews share their parent's. */
		messages?: Messages;
	}
	let { blocks, plugins, nested = false, messages }: Props = $props();

	provideText(() => messages);
	const tr = useText();

	const pluginOf = (type: string) => plugins.find((p) => p.type === type);

	// Inline markdown -> html: text is escaped first, links are http(s), mailto, tel or site-relative only (see inline()).
	const html = (b: StoredBlock) => inline(b.text ?? '');
	const indent = (b: StoredBlock) => (b.indent ? `${b.indent * 1.5}em` : undefined);
</script>

{#snippet list(node: ListNode)}
	{#if node.type === 'md:ol'}
		{@const start = olStart(node.items[0]?.block.props)}
		<ol start={start === 1 ? undefined : start}>{@render items(node)}</ol>
	{:else}
		<ul class:todo={node.type === 'md:todo'}>{@render items(node)}</ul>
	{/if}
{/snippet}

{#snippet items(node: ListNode)}
	{#each node.items as it, n (n)}
		<li>
			{#if node.type === 'md:todo'}
				<input type="checkbox" checked={!!it.block.props?.checked} disabled aria-label={tr('Done')} />
			{/if}
			{@html html(it.block)}
			{#each it.children as child, c (c)}{@render list(child)}{/each}
		</li>
	{/each}
{/snippet}

{#snippet run(items: StoredBlock[])}
	{#each parts(items) as part, n (n)}
		{#if part.kind === 'lists'}
			{#each part.lists as l, m (m)}{@render list(l)}{/each}
		{:else}
			{@const b = part.block}
			{@const plugin = pluginOf(b.type)}
			{#if b.type === 'md:p'}
				{#if b.text}<p style:margin-left={indent(b)}>{@html html(b)}</p>{/if}
			{:else if b.type === 'md:h1'}
				<h1>{@html html(b)}</h1>
			{:else if b.type === 'md:h2'}
				<h2>{@html html(b)}</h2>
			{:else if b.type === 'md:h3'}
				<h3>{@html html(b)}</h3>
			{:else if b.type === 'md:h4'}
				<h4>{@html html(b)}</h4>
			{:else if b.type === 'md:h5'}
				<h5>{@html html(b)}</h5>
			{:else if b.type === 'md:h6'}
				<h6>{@html html(b)}</h6>
			{:else if b.type === 'md:quote'}
				<blockquote style:margin-left={indent(b)}><p>{@html html(b)}</p></blockquote>
			{:else if b.type === 'md:code'}
				{@const lang = String(b.props?.lang ?? '')}
				<pre><code class={lang ? `language-${lang}` : undefined}>{b.text ?? ''}</code></pre>
			{:else if b.type === 'md:hr'}
				<hr />
			{:else if plugin?.preview}
				<!-- a plugin without a preview is drawn by the app's own renderer, not here -->
				<plugin.preview props={b.props ?? {}} blocks={b.blocks ?? []} {plugins} />
			{/if}
		{/if}
	{/each}
{/snippet}

<div class="preview" class:nested>
	{@render run(blocks)}
</div>

<style lang="scss">
	// Only what the renderer itself adds; the article typography comes from the page that shows it.
	.preview {
		:global(ul.todo) {
			list-style: none;
			padding-left: 0.2em;
		}
		:global(ul.todo input) {
			margin-right: 0.5em;
		}
		:global(img) {
			max-width: 100%;
		}

		&:not(.nested) {
			// The content starts at its top edge, whatever its first block is (pages often align it with a sidebar).
			> :global(:first-child),
			> :global(:first-child > :first-child) {
				margin-top: 0;
			}
			// Floating images and side boxes stay inside the content.
			&::after {
				content: '';
				display: block;
				clear: both;
			}
		}
	}
</style>
