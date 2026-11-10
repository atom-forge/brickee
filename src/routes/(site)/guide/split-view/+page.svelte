<script lang="ts">
	import { DocApiBlock, DocApiTable, DocInlineCode, DocShowExample, ProseDivider, ProsePage, ProseParagraph, ProseText, ProseTitle, type PropDef } from '@atom-forge/ui';

	import SplitView from './examples/SplitView.svelte';
	import splitView from './examples/SplitView.svelte?raw';

	const api: PropDef[] = [
		{ name: 'scrollSync()', type: 'ScrollSync', description: 'Creates one editor → preview pair.' },
		{ name: 'sync.source', type: 'Action<HTMLElement>', description: "On the editor's scrolling box." },
		{ name: 'sync.target', type: 'Action<HTMLElement, boolean>', default: 'true', description: "On the preview's scrolling box; the parameter turns following on and off." },
		{ name: 'sync.align()', type: '() => void', description: 'Re-syncs now, e.g. after the preview width changed.' },
		{ name: 'scrollFraction(box)', type: 'number', description: 'How far a box is scrolled, 0…1.' },
		{ name: 'setScrollFraction(box, f)', type: 'void', description: 'Scrolls a box to a fraction — to keep the place across a layout change.' }
	];
</script>

<ProsePage>
	<ProseParagraph>
		<ProseTitle>Split view</ProseTitle>
		<ProseText>
			<DocInlineCode>scrollSync()</DocInlineCode> keeps a preview scrolled to the same fraction as the editor. It is one way,
			needs no markup in the document, and also re-aligns when the preview's content changes size. It is proportional: the
			two sides show roughly the same place, not the same block.
		</ProseText>
		<DocApiBlock title="API">
			<DocApiTable props={api} />
		</DocApiBlock>
	</ProseParagraph>

	<ProseDivider />

	<ProseParagraph>
		<ProseTitle level={3}>Editor and preview side by side</ProseTitle>
		<ProseText>Scroll the editor; turn the switch off to let the preview stay where it is.</ProseText>
		<DocShowExample class="block" component={SplitView} code={splitView} />
	</ProseParagraph>
</ProsePage>
