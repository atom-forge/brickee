<!-- What a plugin without content shows until its props are set. -->
<script lang="ts">
	import { useText } from '../i18n';
	import type { Icon } from '../palette';

	let { icon: I, text }: { icon: Icon; text: string } = $props();
	const tr = useText();
</script>

<div class="empty"><I size={18} /> {tr(text)}</div>

<style>
	.empty {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 96px;
		border: 1px dashed #d4d4da;
		border-radius: 10px;
		color: #a0a0a8;
		font: 14px system-ui, sans-serif;
	}
</style>
