<script lang="ts">
	import {Atom, Button, CommandPalette, defineIcon, getDrawerManager, getModalManager} from "@atom-forge/ui";
	import {page} from "$app/state";
	import {Book, ExternalLink, Heart, Menu, Package, Search} from "@lucide/svelte";
	import GithubIcon from "./GithubIcon.svelte";
	import {uiIcon} from "./icon";
	import type {Snippet} from "svelte";
	import NavDesktop from "./NavDesktop.svelte";
	import NavMobile from "./NavMobile.svelte";
	import ThemeSwitch from "./ThemeSwitch.svelte";
	import type {MenuItem, MenuItemLeaf} from "./nav-types";
	import {afterNavigate, goto} from "$app/navigation";
	import {ALL_PAGES, SIDEBAR_STRUCTURE} from "./nav";

	const {children}: { children: Snippet } = $props();

	let headerHeight = $state(0);

	afterNavigate(() => { window.scrollTo({ top: 0 }); });
	const drawerManager = getDrawerManager();
	const modalManager = getModalManager();

	const pathname = $derived(page.url.pathname.replace(/\/$/, '') || '/');

	const EXTERNAL: MenuItem[] = [
		{type: 'separator'},
		{label: 'Documentation', icon: uiIcon(Book), href: 'https://github.com/atom-forge/brickee/blob/main/docs/en/index.md'},
		{label: 'npm', icon: uiIcon(Package), href: 'https://www.npmjs.com/package/@atom-forge/brickee'},
		{label: 'atom-forge.eu', icon: uiIcon(ExternalLink), href: 'https://atom-forge.eu'},
		{label: 'GitHub', icon: uiIcon(ExternalLink), href: 'https://github.com/atom-forge/brickee'},
		{label: 'Support', icon: uiIcon(Heart), href: 'https://github.com/sponsors/laborci'},
	];

	const pageCommands = $derived(ALL_PAGES.map(g => ({
		id: g.value,
		label: g.label,
		group: g.group,
		icon: g.icon,
		description: g.description,
		keywords: g.keywords,
		onSelect: () => { modalManager.close(); goto(g.value + '/'); },
	})));

	function openSearch() {
		modalManager.open(CommandPalette, { items: pageCommands, placeholder: 'Search the guide…', close: () => modalManager.close() });
	}

	function onKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			openSearch();
		}
	}

	$effect(() => {
		if (drawerManager.drawers.length > 0) {
			const scrollY = window.scrollY;
			let startY = 0;
			const trackStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };

			const preventTouch = (e: TouchEvent) => {
				const deltaY = e.touches[0].clientY - startY;
				let el = e.target as HTMLElement | null;
				while (el && el !== document.body) {
					const oy = getComputedStyle(el).overflowY;
					if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) {
						if (deltaY > 0 && el.scrollTop === 0) break;
						if (deltaY < 0 && el.scrollTop + el.clientHeight >= el.scrollHeight) break;
						return;
					}
					el = el.parentElement;
				}
				e.preventDefault();
			};

			document.addEventListener('touchstart', trackStart, { passive: true });

			document.body.style.position = 'fixed';
			document.body.style.top = `-${scrollY}px`;
			document.body.style.left = '0';
			document.body.style.right = '0';
			document.addEventListener('touchmove', preventTouch, { passive: false });

			return () => {
				document.body.style.position = '';
				document.body.style.top = '';
				document.body.style.left = '';
				document.body.style.right = '';
				document.removeEventListener('touchstart', trackStart);
				document.removeEventListener('touchmove', preventTouch);
				window.scrollTo(0, scrollY);
			};
		}
	});

	function enrichItems(items: MenuItem[]): MenuItem[] {
		return items.map(item => {
			if (item.type === 'heading' || item.type === 'separator') return item;
			const leaf = item as MenuItemLeaf;
			const children = leaf.children ? enrichItems(leaf.children) : undefined;
			const active = pathname === leaf.href?.replace(/\/$/, '') || !!children?.some(child => !child.type && child.active);
			return {
				...leaf,
				active,
				onclick: leaf.href ? () => (leaf.href!.startsWith('http') ? (window.location.href = leaf.href!) : goto(leaf.href!)) : undefined,
				children
			} as MenuItem;
		});
	}

	const navItems: MenuItem[] = $derived(enrichItems([...SIDEBAR_STRUCTURE, ...EXTERNAL]));
</script>

<svelte:window onkeydown={onKeydown}/>
<div class="flex min-h-screen flex-col bg-canvas" style:--app-header-h="{headerHeight}px">
	<!-- Full-width background with content-width header -->
	<div class="sm:bg-surface shrink-0 sm:border-b border-frame sm:sticky sm:top-0 sm:z-30" bind:clientHeight={headerHeight}>
		<div class="mx-auto flex w-full max-w-[1360px] items-center gap-3 p-4">
		<button class="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer" onclick={() => goto('/')}>
			<Atom/>
			<span class="text-2xl flex">
				<span class="font-extralight text-canvas-contrast">Atom</span>
				<span class="font-extrabold text-accent">Forge</span>
				<span class="ml-2 font-light text-muted-contrast">Brickee</span>
			</span>
		</button>

		<!-- Search + ThemeSwitch: tablet and desktop only -->
		<div class="hidden sm:flex items-center gap-2 ml-auto">
			<button
				class="flex items-center gap-2 text-xs text-muted-contrast border border-frame rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors"
				onclick={openSearch}
			>
				<Search size={13}/> Search <kbd class="ml-1 opacity-60">⌘K</kbd>
			</button>
			<a
				href="https://github.com/atom-forge/brickee/blob/main/docs/en/index.md"
				class="hidden sm:flex items-center gap-2 text-xs text-muted-contrast border border-frame rounded-lg px-3 py-1.5 hover:bg-secondary transition-colors no-underline"
			>
				<Book size={13}/> Documentation
			</a>
			<a
				href="https://github.com/atom-forge/brickee"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center justify-center w-8 h-8 rounded-lg text-muted-contrast border border-frame hover:bg-secondary transition-colors"
				title="GitHub"
			>
				<GithubIcon size={16}/>
			</a>
			<a
				href="https://github.com/sponsors/laborci"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center justify-center w-8 h-8 rounded-lg text-muted-contrast border border-frame hover:bg-secondary hover:text-red-500 transition-colors"
				title="Support"
			>
				<Heart size={16}/>
			</a>
			<ThemeSwitch/>
		</div>
		<!-- Menu stays at the right edge on mobile and tablet. -->
		<Button
			class="lg:hidden ml-auto sm:ml-0"
			icon={defineIcon(uiIcon(Menu), 12)}
			ghost
			compact
			onclick={() => drawerManager.open(NavMobile, { items: navItems }, { position: 'right', size: 'normal' })}
		/>
		</div>
	</div>
	<div class="mx-auto flex w-full max-w-[1360px] flex-1 gap-6 px-4 lg:gap-8">
		{#if navItems.length}
		<NavDesktop items={navItems}/>

		{/if}
		<div class="flex-1 min-w-0 py-4">
			{@render children()}
		</div>
	</div>
</div>
