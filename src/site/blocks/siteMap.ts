import type { BlockPlugin } from '@atom-forge/brickee';
import { map } from '@atom-forge/brickee/plugins';
import SiteMap from './SiteMap.svelte';

/** The bundled map with an extra field and the site's own preview. Same `type`, so stored maps keep working. */
export const siteMap: BlockPlugin = {
	...map,
	props: () => ({ ...map.props(), caption: '' }),
	fields: [...(map.fields ?? []), { key: 'caption', label: 'Caption', kind: 'text' }],
	tag: (p) => (p.caption ? `map · ${p.caption}` : map.tag(p as never)),
	preview: SiteMap
};
