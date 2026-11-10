# Az alkalmazás kontextusai

[← Előző](writing-plugins.md) · [Tartalom](index.md) · [Következő →](server-side.md)

A szerkesztőnek nincsenek propjai az alkalmazás fogalmaihoz. Amit a befogadó alkalmazás tud — az éppen mutatott oldalszélességet, a kiemelhető kódnyelveket, a nyelvét —, az három Svelte-kontextuson keresztül jut el a pluginokhoz. Mindegyikhez tartozik egy `provide…` függvény, amelyet a szerkesztő vagy az előnézet fölötti komponens inicializálásakor hívsz meg, és egy `use…` függvény a plugin-komponensek számára.

| Kontextus | Megadás | Olvasás | Mit hordoz |
|---|---|---|---|
| Nézet | `provideView(() => key)` | `useView()` | A nézet, amelyet a nézetenkénti mezők szerkesztenek. |
| Kódnyelvek | `provideCodeLanguages(() => list)` | `useCodeLanguages()` | A nyelvek, amelyeket a kódblokk felkínál. |
| Szöveg | `messages` prop, vagy `provideText(() => messages)` | `useText()` | Felületi szövegek az alkalmazás nyelvén. |

A beágyazott szerkesztők és előnézetek mindhármat a szülőjüktől öröklik.

A képek nem kontextuson keresztül érkeznek: hogy egy képblokk mit tárol, és honnan veszi a képeit, azt az alkalmazás saját pluginja dönti el (lásd [Képek](writing-plugins.md#képek)).

## Nézetenkénti értékek

Egyes beállítások attól függnek, hogyan jelenik meg az oldal: egy képnek telefonon más képarány kellhet, mint széles képernyőn. A `views` beállítással rendelkező `slider` mező nézetenként tárol értéket. Itt ez a [Pluginok írása](writing-plugins.md#képek) fejezet `photo` pluginjának magassága és a mellékelt `gap`:

```ts
import type { BlockPlugin } from '@atom-forge/brickee';
import { gap } from '@atom-forge/brickee/plugins';
import { photo } from './photo';

export const VIEWS = [
	{ key: 'desktop', label: 'Desktop' },
	{ key: 'tablet', label: 'Tablet' },
	{ key: 'phone', label: 'Phone' }
];

/** Ugyanaz a plugin, az egyik mezője nézetenként állítva. */
const perView = (plugin: BlockPlugin, key: string): BlockPlugin => ({
	...plugin,
	fields: plugin.fields?.map((f) => (f.key === key ? { ...f, views: VIEWS } : f))
});

export const plugins = [perView(photo, 'ratio'), perView(gap, 'lines')];
```

Hogy milyen nézetek léteznek, és melyik látszik éppen, az az alkalmazás dolga. Az alkalmazás a `provideView`-val közli a szerkesztővel az aktuális nézetet, jellemzően egy szerkesztő melletti szélességváltóból:

```svelte
<script lang="ts">
	import { Editor, provideView, type StoredBlock } from '@atom-forge/brickee';
	import { plugins } from './blocks';

	let { value = $bindable(), view }: { value: StoredBlock[]; view: string } = $props();
	provideView(() => view);
</script>

<Editor bind:value {plugins} />
```

Hogyan viselkednek az értékek:

- Az első nézet az **alap**. Minden további nézet, amíg nincs saját értéke, az előtte lévő nézet értékét veszi át; a mező ilyenkor örököltként jelölve mutatja az értéket.
- A mező az aktuális nézet értékét szerkeszti, és a saját címkéje mellett a nézet címkéjét is mutatja. `provideView` nélkül, vagy ha a kulcs nem szerepel a `views`-ban, az alapértéket szerkeszti.
- Tárolás: ha csak alapérték van → önmagában, egyszerű értékként tárolódik (`"ratio": "56"`); ha más nézeteknek saját értékük van → nézet szerint kulcsolt objektumként (`"ratio": { "desktop": "56", "phone": "100" }`). Azok a dokumentumok, amelyek még azelőtt íródtak, hogy egy mező nézetenkéntivé vált, érvényesek maradnak.

Az előnézet a `viewValues(value, keys)`-szel olvassa ki őket — minden nézet értékét, az öröklést alkalmazva —, vagy csak az alapértéket a `baseValue(value)`-val. A photo előnézetének ez a változata CSS-változókon keresztül szélességenként egy-egy képarányt ad a böngészőnek:

```svelte
<script lang="ts">
	import { viewValues, type PluginPreviewProps } from '@atom-forge/brickee';
	import { aspect, imageSrc, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const src = $derived(imageSrc(props.url));
	// desktop, tablet, phone: mindegyikhez egy CSS aspect-ratio ('auto': a kép saját alakja)
	const r = $derived(viewValues(props.ratio, ['desktop', 'tablet', 'phone']).map((v) => aspect(v) ?? 'auto'));
</script>

{#if src}
	<img {src} alt={props.alt ?? ''} style:--r-desktop={r[0]} style:--r-tablet={r[1]} style:--r-phone={r[2]} />
{/if}

<style>
	img {
		width: 100%;
		object-fit: cover;
		aspect-ratio: var(--r-phone);
	}
	@media (min-width: 640px) {
		img {
			aspect-ratio: var(--r-tablet);
		}
	}
	@media (min-width: 1024px) {
		img {
			aspect-ratio: var(--r-desktop);
		}
	}
</style>
```

> **Csak csúszkák**
>
> A `views` a `slider` mezőkön támogatott. A többi mezőfajta figyelmen kívül hagyja.

## Kódnyelvek

A kódblokk nyelve (`props.lang`, a markdown-kerítés info-szövege) alapból szabad szöveg. Ha az alkalmazás tudja, mely nyelveket tud kiemelni az oldala, megadja a listát, és a kódblokk mezősávjában a mező legördülő lista lesz, elején a *Nincs* opcióval:

```svelte
<script lang="ts">
	import { Editor, provideCodeLanguages, type StoredBlock } from '@atom-forge/brickee';

	let { value = $bindable() }: { value: StoredBlock[] } = $props();
	provideCodeLanguages(() => [{ value: 'ts', label: 'TypeScript' }, { value: 'svelte', label: 'Svelte' }, 'css', 'bash']);
</script>

<Editor bind:value />
```

Egy elem string vagy `{ value, label? }`; a `value` kerül tárolásra. A beágyazott szerkesztők öröklik a listát. Egy tárolt nyelv, amely nincs a listában, opció marad, így egy régebbi dokumentum megnyitásakor semmi sem vész el.

## Felületi szövegek

A szerkesztő és a pluginok angolul íródtak, és az angol szöveg a fordításának kulcsa. Add át a `messages`-t — egy objektumot, amely az angol szövegeket a te nyelvedre képezi le — a legfelső szintű szerkesztőnek és előnézetnek:

```svelte
<script lang="ts">
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { hu } from '@atom-forge/brickee/locales/hu';

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value plugins={PLUGINS} messages={hu} />
```

Az `@atom-forge/brickee/locales/hu` a `hu`-t exportálja: a szerkesztő és az összes mellékelt plugin magyar szövegeit. Bővítsd ki a saját pluginjaid és mezőid szövegeivel:

```ts
import type { Messages } from '@atom-forge/brickee';
import { hu } from '@atom-forge/brickee/locales/hu';

export const messages: Messages = {
	...hu,
	Button: 'Gomb',
	'A link as a button': 'Egy link gombként',
	Desktop: 'Asztali',
	Phone: 'Telefon'
};
```

Amit a szerkesztő magától lefordít:

- a beépített blokkok és a pluginok `label`, `hint` és `keys` értékeit (a perjeles menü az angol és a lefordított szavak között is keres);
- egy plugin `tag`-jének részeit, ` · `-nál darabolva;
- a mezők címkéit, helyőrzőit, az opciók címkéit, a `none` címkéket és a nézetcímkéket;
- az `Empty` szövegét és a szerkesztő saját felületét.

Azt a szöveget, amelyet egy plugin maga renderel — a nézetében vagy az előnézetében —, a `useText()`-en keresztül add ki:

```svelte
<script lang="ts">
	import { useText, type PluginPreviewProps } from '@atom-forge/brickee';

	let { props }: PluginPreviewProps = $props();
	const tr = useText();
</script>

<p>{tr('Map: {place}', { place: String(props.q ?? '') })}</p>
```

A `{name}` helyőrzőket a második argumentum tölti ki. Komponenseken kívül a `translator(messages)` ugyanilyen függvényt ad vissza. A `messages`-ből hiányzó szöveg angol marad.
