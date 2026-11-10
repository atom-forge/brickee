import type { BlockPlugin } from '@atom-forge/brickee';

/** The views per-view fields store a value for; the first is the base. */
export const VIEWS = [
	{ key: 'desktop', label: 'Desktop' },
	{ key: 'tablet', label: 'Tablet' },
	{ key: 'phone', label: 'Phone' }
];
export const VIEW_KEYS = VIEWS.map((v) => v.key);

/** The same plugin, with one of its fields set per view. */
export const perView = (plugin: BlockPlugin, key: string): BlockPlugin => ({
	...plugin,
	fields: plugin.fields?.map((f) => (f.key === key ? { ...f, views: VIEWS } : f))
});
