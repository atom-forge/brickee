import {
	Blocks, Braces, Code, Columns2, FileText, Languages, MapPin, MonitorSmartphone, MousePointerClick, PenLine,
	Replace, Sigma, SlidersHorizontal, SquarePlay, StickyNote, Table, UnfoldVertical
} from '@lucide/svelte';
import type { MenuItem } from './nav-types';

export type NavItem = {
	value: string;
	label: string;
	group: string;
	icon: any;
	keywords?: string[];
	description?: string;
};

export type NavGroup = {
	key: string;
	label: string;
	icon: any;
	description: string;
	items: NavItem[];
};

/** Every page of the site, grouped: the sidebar, the home page cards and the ⌘K search are built from it. */
export const NAV_GROUPS: NavGroup[] = [
	{
		key: 'guide', label: 'Guide', icon: PenLine, description: 'The editor, the preview and the stored document.', items: [
			{ value: '/guide/editor', label: 'Editor and preview', group: 'Guide', icon: PenLine, description: 'Editor, Preview, read-only, palette', keywords: ['editor', 'preview', 'readonly', 'palette', 'placeholder'] },
			{ value: '/guide/split-view', label: 'Split view', group: 'Guide', icon: Columns2, description: 'Scroll sync between editor and preview', keywords: ['scroll', 'sync', 'split'] },
			{ value: '/guide/markdown', label: 'Markdown', group: 'Guide', icon: FileText, description: 'toMarkdown and fromMarkdown', keywords: ['markdown', 'export', 'import', 'copy'] },
			{ value: '/guide/stored', label: 'Stored form', group: 'Guide', icon: Braces, description: 'StoredBlock[] JSON and the zod schema', keywords: ['json', 'schema', 'zod', 'validate', 'server'] }
		]
	},
	{
		key: 'plugins', label: 'Bundled plugins', icon: Blocks, description: 'The four general blocks in @atom-forge/brickee/plugins.', items: [
			{ value: '/plugins/table', label: 'Table', group: 'Bundled plugins', icon: Table, description: 'Rows and columns of inline text', keywords: ['table', 'grid', 'gfm'] },
			{ value: '/plugins/youtube', label: 'YouTube', group: 'Bundled plugins', icon: SquarePlay, description: 'A video from a link', keywords: ['youtube', 'video', 'embed'] },
			{ value: '/plugins/map', label: 'Map', group: 'Bundled plugins', icon: MapPin, description: 'Google Maps for a place', keywords: ['map', 'google', 'address'] },
			{ value: '/plugins/math', label: 'Formula', group: 'Bundled plugins', icon: Sigma, description: 'A LaTeX formula ($$…$$)', keywords: ['math', 'formula', 'equation', 'latex'] },
			{ value: '/plugins/gap', label: 'Gap', group: 'Bundled plugins', icon: UnfoldVertical, description: 'Empty space between blocks', keywords: ['gap', 'space', 'spacer'] }
		]
	},
	{
		key: 'custom', label: 'Your own blocks', icon: MousePointerClick, description: 'Writing, nesting and overriding plugins, and their own forms.', items: [
			{ value: '/custom/plugin', label: 'Writing a plugin', group: 'Your own blocks', icon: MousePointerClick, description: 'A button block: view, preview, fields', keywords: ['plugin', 'block', 'custom', 'fields'] },
			{ value: '/custom/container', label: 'Containers', group: 'Your own blocks', icon: StickyNote, description: 'A block holding blocks, with Frame', keywords: ['container', 'nested', 'frame', 'accepts'] },
			{ value: '/custom/form', label: 'Custom fields form', group: 'Your own blocks', icon: SlidersHorizontal, description: 'A form of your own in the fields bar', keywords: ['form', 'fields', 'picker', 'image', 'photo', 'context'] },
			{ value: '/custom/override', label: 'Overriding a plugin', group: 'Your own blocks', icon: Replace, description: 'Own preview and extra fields', keywords: ['override', 'preview', 'extend'] }
		]
	},
	{
		key: 'contexts', label: 'Host contexts', icon: MonitorSmartphone, description: 'Code languages and UI text from the host app.', items: [
			{ value: '/contexts/code', label: 'Code languages', group: 'Host contexts', icon: Code, description: 'A dropdown of languages for code blocks', keywords: ['code', 'language', 'syntax', 'highlight'] },
			{ value: '/contexts/i18n', label: 'Localisation', group: 'Host contexts', icon: Languages, description: 'UI text in the host language', keywords: ['i18n', 'language', 'hungarian', 'messages'] }
		]
	}
];

export const ALL_PAGES: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const SIDEBAR_STRUCTURE: MenuItem[] = NAV_GROUPS.map((g) => ({
	label: g.label,
	icon: g.icon,
	children: g.items.map((i) => ({ label: i.label, icon: i.icon, href: i.value + '/' }))
}));
