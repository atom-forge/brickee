<script lang="ts">
	import { Switch, defineIcon, getThemeManager } from '@atom-forge/ui';
	import { Moon, Sun } from '@lucide/svelte';

	const theme = getThemeManager();
	import { uiIcon } from './icon';
</script>

{#if theme}
	<Switch bind:value={theme.dark} icons={{ on: defineIcon(uiIcon(Moon)), off: defineIcon(uiIcon(Sun)) }} />
{/if}
