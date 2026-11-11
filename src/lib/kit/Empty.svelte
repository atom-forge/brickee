<!-- What a plugin without content shows until its props are set. -->
<script lang="ts">
	import { useText } from '../i18n';
	import type { Icon } from '../palette';

	let { icon: I, text }: { icon: Icon; text: string } = $props();
	const tr = useText();
</script>

<div class="flex min-h-24 items-center justify-center gap-2 rounded-[10px] border border-dashed border-frame font-sans text-sm leading-[normal] text-muted-contrast">
	<I size={18} />
	{tr(text)}
</div>
