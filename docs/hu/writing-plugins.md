# Pluginok írása

[← Előző](bundled-plugins.md) · [Tartalom](index.md) · [Következő →](host-contexts.md)

Egy plugin egy `BlockPlugin` objektum és két Svelte-komponens: egy **nézet** a szerkesztőhöz és egy **előnézet** az oldalhoz. Mindent, amire egy pluginnak szüksége van, az `@atom-forge/brickee` exportál — a mellékelt pluginok sem használnak mást.

## Felépítés

| Tag | Típus | Jelentés |
|---|---|---|
| `type` | `string` | A tárolt `type`. Nem kezdődhet `md:`-vel; hogy átmenjen a sémán, illeszkednie kell a `^[a-z][a-z0-9:-]{0,39}$` mintára. |
| `label`, `hint` | `string` | Név és rövid leírás a perjeles és az „Átalakítás” menüben. |
| `keys` | `string` | További keresőszavak a perjeles menühöz. |
| `icon` | `Icon` | Egy `@lucide/svelte` ikonkomponens. |
| `props` | `() => P` | Egy új blokk propsai. |
| `fields` | `PropField[]` | A blokk tetején lévő beállítások (opcionális). |
| `form` | `Component<PluginFormProps>` | A plugin saját űrlapja a mezősávban, a mezők alatt (opcionális; lásd [Saját mezőűrlap](#saját-mezőűrlap)). |
| `tag` | `(props: P) => string` | A blokk tetején, a mezői előtt álló kis címke. A ` · `-tal elválasztott részeit egyenként fordítja le. |
| `content` | `'none' \| 'text' \| 'plain' \| 'blocks'` | Mit tartalmaz a blokk. A pluginok `'none'`-t (csak props) vagy `'blocks'`-ot (beágyazott dokumentum) használnak; ez dönti el, mit kínál az „Átalakítás” menü. |
| `view` | `Component<PluginViewProps>` | A blokk a szerkesztőben. |
| `preview` | `Component<PluginPreviewProps>` | A blokk az oldalon (opcionális). Nélküle a `Preview` semmit sem renderel a blokkhoz — saját megjelenítővel dolgozó alkalmazásoknak. |
| `accepts` | `string[]` | Egy tároló blokk megengedett beágyazott blokkjai, palettaazonosítókként; az `'md:*'` az összes beépített blokk. Alapértelmezés: minden, amit az alkalmazás kínál. |
| `markdown` | `(props: P, ctx: MarkdownContext) => string` | A markdown alakja (opcionális). |
| `unique` | `boolean` | Dokumentumonként legfeljebb egy, csak a legfelső szinten. |

A `P` a plugin props-típusa; `Record<string, unknown>`-t kiterjesztő interfészként deklaráld.

## Plugin tartalom nélkül

Egy linkgomb: felirat, link, méret és szín — mind mezőkben állítható, magába a blokkba semmit sem kell gépelni.

```ts
// safe-url.ts — csak azok a linkek, amelyeket az oldal megjeleníthet
export const safeUrl = (u: unknown) => {
	const s = String(u ?? '').trim();
	return /^(https?:|mailto:|\/(?!\/))/.test(s) ? s : '';
};
```

```svelte
<!-- ButtonView.svelte: a blokk a szerkesztőben -->
<script lang="ts" module>
	export interface ButtonProps extends Record<string, unknown> {
		label: string;
		url: string;
		size: 'normal' | 'large';
		color: string;
	}
</script>

<script lang="ts">
	import { MousePointerClick } from '@lucide/svelte';
	import { Empty, safeColor, type PluginViewProps } from '@atom-forge/brickee';

	// Mindkettő bindable, akkor is, ha a nézet nem használja őket: a szerkesztő minden plugin-nézeten bindolja őket.
	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<ButtonProps> = $props();
</script>

{#if props.label}
	<span class="button" style:background={safeColor(props.color, '#2563eb')}>{props.label}</span>
{:else}
	<Empty icon={MousePointerClick} text="Set the label and the link above" />
{/if}

<style>
	.button {
		display: inline-block;
		padding: 0.5em 1.2em;
		border-radius: 8px;
		color: #fff;
	}
</style>
```

```svelte
<!-- ButtonPreview.svelte: a blokk az oldalon -->
<script lang="ts">
	import { safeColor, type PluginPreviewProps } from '@atom-forge/brickee';
	import type { ButtonProps } from './ButtonView.svelte';
	import { safeUrl } from './safe-url';

	let { props }: PluginPreviewProps<ButtonProps> = $props();
	const href = $derived(safeUrl(props.url));
</script>

{#if href && props.label}
	<p>
		<a class="button" class:large={props.size === 'large'} {href} style:background={safeColor(props.color, '#2563eb')}>
			{props.label}
		</a>
	</p>
{/if}
```

```ts
// button.ts: a plugin
import { MousePointerClick } from '@lucide/svelte';
import { mdText, type BlockPlugin } from '@atom-forge/brickee';
import ButtonView, { type ButtonProps } from './ButtonView.svelte';
import ButtonPreview from './ButtonPreview.svelte';
import { safeUrl } from './safe-url';

export const button: BlockPlugin<ButtonProps> = {
	type: 'button',
	label: 'Button',
	hint: 'A link as a button',
	keys: 'button link cta',
	icon: MousePointerClick,
	props: () => ({ label: '', url: '', size: 'normal', color: '#2563eb' }),
	fields: [
		{ key: 'label', label: 'Label', kind: 'text' },
		{ key: 'url', label: 'Link', kind: 'text', placeholder: 'https://…', parse: (s) => s.trim() },
		{
			key: 'size',
			label: 'Size',
			kind: 'select',
			options: [
				{ value: 'normal', label: 'Normal' },
				{ value: 'large', label: 'Large' }
			]
		},
		{ key: 'color', label: 'Colour', kind: 'color' }
	],
	tag: (p) => (p.size === 'large' ? 'button · large' : 'button'),
	content: 'none',
	markdown: (p) => {
		const href = safeUrl(p.url);
		return href ? `[${mdText(p.label) || href}](${href})` : '';
	},
	view: ButtonView,
	preview: ButtonPreview
};
```

Regisztráld a többi mellé:

```svelte
<Editor bind:value plugins={[...PLUGINS, button]} />
<Preview blocks={value} plugins={[...PLUGINS, button]} />
```

> **A props a felhasználóktól jön**
>
> Egy plugin propsa az, ami el lett tárolva — amit egy szerkesztő begépelt, beillesztett, vagy amit bárki, aki dokumentumot menthet, elküldött az API-dnak. A séma csak az alakot ellenőrzi. Minden előnézetnek megbízhatatlanként kell kezelnie a propsot: a színeket a `safeColor`-on keresztül vedd át, ellenőrizd a linkeket és a képek címét, és korlátozd a számokat. A Svelte escape-eli a `{...}`-ban lévő szöveget; propot soha ne tegyél `{@html}`-be.

## Mezők

Minden `PropField` egy beállítás a blokk tetején. A szerkesztő rajzolja ki őket, és az értéküket a `props`-ban tárolja.

| Tag | Jelentés |
|---|---|
| `key` | A prop, amelyet szerkeszt. |
| `label` | A címkéje (a `messages`-en keresztül fordítva). |
| `kind` | `text`, `textarea`, `color`, `select`, `slider` vagy `toggles`. |
| `placeholder` | Üres szövegmező tippje; opcionális színnél az a szín, amelyről a „none” gombra kattintás indul. |
| `options` | `{ value, label }[]` a `select`-hez, valamint az értékeken lépkedő `slider`-hez. Egy opció címkéje tartalmazhat `{n}`-t, amelyet az értéke tölt ki. A `toggles`-hez `{ value, label, icon }[]`: az `icon` a gomb, a `label` a buboréksúgója. |
| `min`, `max`, `step`, `unit` | Számcsúszka (`slider`): a tartománya, a lépésköze (alapértelmezés 1) és az érték után mutatott mértékegység. |
| `none` | A beállítatlan állapot címkéje: számcsúszkánál a `min`-től balra lévő rovátka, opcionális színnél a „none” gomb. |
| `format` | A mező szövege a tárolt értékből (alapértelmezés: az érték szövegként). |
| `parse` | A tárolt érték a mező szövegéből (alapértelmezés: maga a szöveg). |

Az egyes fajták így tárolják az értéküket:

| Fajta | Tárolt érték |
|---|---|
| `text`, `textarea` | A szöveg, vagy amit a `parse` visszaad (a `parse: lines` sorok listáját tárolja). |
| `select` | A kiválasztott opció `value`-ja. |
| `slider` `options`-szel | A csúszka pozíciójában lévő opció értéke. |
| `slider` `min`-nel és `max`-szal | A szám szövegként (például `'56'`); a `none` rovátka eltávolítja a kulcsot. |
| `color` | Egy `#rrggbb` szöveg; `none` esetén a törlése eltávolítja a kulcsot. |
| `toggles` | A bekapcsolt opciók listája az `options` sorrendjében (ha egy sincs, `[]`); ilyen a beépített táblázat fejléce és lábléce. |

Az üres érték (`''`, `null` vagy `undefined`, akkor is, ha a `parse` adja vissza) eltávolítja a kulcsot a `props`-ból, ezért az előnézetnek mindig kezelnie kell a hiányzó propot. A mező `parse`-a jó hely a bemenet normalizálására is: a mellékelt YouTube-mező bármilyen YouTube-linket elfogad, de csak a videó azonosítóját tárolja.

## Saját mezőűrlap

A generált mezők az egyszerű beállításokat fedik le. Minden máshoz — az alkalmazás saját választójához, az alkalmazás saját adataiból vagy kontextusából vett értékekhez, egy szkripthez — a plugin saját `form`-ot ad: bármilyen Svelte-komponenst, amely a blokk mezősávjában, a mezők alatt jelenik meg (vagy egyedül, ha a pluginnak nincsenek `fields`-ei).

Az űrlap `PluginFormProps`-ot kap:

| Prop | Jelentés |
|---|---|
| `props` | A blokk propsa (bindable). Új objektumot adj értékül (`props = { ...props, image: id }`): ez a blokk egy szerkesztése, saját visszavonási lépéssel. |
| `readonly` | A szerkesztő csak olvasható. Ilyenkor a mezősáv, és vele az űrlap sem látszik. |

Az űrlap az alkalmazás kódja, így ott veszi az adatait, ahol az alkalmazás tartja őket — a saját moduljaiban, store-jaiban, vagy egy Svelte-kontextusban, amelyet az alkalmazás a szerkesztő fölött ad meg (a plugin-komponensek alatta renderelődnek). A szerkesztő semmit sem tud róla. Egy `photo` blokk például az alkalmazás képtárában lévő kép azonosítóját tárolja, és annak az albumnak a képeit kínálja fel, amelyet az alkalmazás egy saját kontextusban megnevez:

```ts
// images.ts — az alkalmazás saját adatai és kontextusa
import { getContext, setContext } from 'svelte';

export const IMAGES = [
	{ id: 'ocean', album: 'cool', url: '/img/ocean.jpg' },
	{ id: 'sunrise', album: 'warm', url: '/img/sunrise.jpg' }
];
export const findImage = (id: unknown) => IMAGES.find((i) => i.id === id);

export const provideAlbum = (get: () => string) => setContext('app:album', get);
export const useAlbum = (): (() => string) => getContext<() => string>('app:album') ?? (() => 'cool');
```

```svelte
<!-- PhotoForm.svelte -->
<script lang="ts">
	import type { PluginFormProps } from '@atom-forge/brickee';
	import { IMAGES, useAlbum } from './images';
	import type { PhotoProps } from './PhotoView.svelte';

	let { props = $bindable() }: PluginFormProps<PhotoProps> = $props();
	const album = useAlbum();
</script>

{#each IMAGES.filter((m) => m.album === album()) as m (m.id)}
	<button type="button" onclick={() => (props = { ...props, image: m.id })}>
		<img src={m.url} alt={m.id} width="64" />
	</button>
{/each}
```

```ts
// photo.ts
export const photo: BlockPlugin<PhotoProps> = {
	type: 'photo',
	// …
	props: () => ({ image: '', alt: '' }),
	fields: [{ key: 'alt', label: 'Alt text', kind: 'text', placeholder: 'What the image shows' }],
	form: PhotoForm,
	view: PhotoView, // a findImage(props.image) képét mutatja
	preview: PhotoPreview, // ugyanígy, az oldalon
	markdown: (p) => {
		const url = findImage(p.image)?.url;
		return url ? `![${mdText(p.alt)}](${url})` : '';
	}
};
```

Az albumot az alkalmazás a szerkesztő körül állítja be a `provideAlbum(() => album)`-mal. A `markdown` komponenseken kívül fut (blokkok másolásakor, a `toMarkdown`-ban), ezért csak modulbeli adatot használhat, kontextust nem. A tárolt azonosító ugyanolyan prop, mint a többi, tehát megbízhatatlan: a nézet és az előnézet az alkalmazás saját keresésével oldja fel, és egy ismeretlenhez semmit sem renderel.

## A nézet

A nézet `PluginViewProps`-ot kap:

| Prop | Jelentés |
|---|---|
| `props` | A blokk propsa (bindable): a nézet helyben is szerkesztheti, ahogy a táblázat teszi. |
| `blocks` | A beágyazott dokumentum (bindable); tartalom nélküli pluginnál mindig `[]`. |
| `readonly` | A szerkesztő csak olvasható. |
| `palette`, `plugins` | Az alkalmazás palettája (már az `accepts`-re szűkítve) és pluginjai, egy beágyazott szerkesztőhöz. |

A `props`-ot és a `blocks`-ot akkor is `$bindable()`-lel deklaráld, ha a nézet nem használja őket. A mezők automatikusan a nézet fölé kerülnek; a nézetnek csak a blokkot kell megjelenítenie. Az `Empty` (`icon` és `text` propokkal) az a szaggatott helyőrző, amelyet a mellékelt pluginok mutatnak, amíg a propsuk nincs beállítva; a szövegét lefordítja.

## Az előnézet

Az előnézet `PluginPreviewProps`-ot kap: `props`, `blocks` és `plugins`. Ez egy egyszerű Svelte-komponens, amely az oldal számára rendereli a blokkot. A felületi szövegek a `useText`-en keresztül érhetők el (lásd [Az alkalmazás kontextusai](host-contexts.md)); minden más, amit az alkalmazás tud, az alkalmazás saját moduljain és kontextusain keresztül jut el hozzá.

## Tárolók

A `content: 'blocks'` beállítású plugin beágyazott dokumentumot tart a `blocks`-ban. A nézete a `Frame`-et használja, egy vékony dobozt, amely a tetején a blokk mezőit, alatta egy beágyazott szerkesztőt rajzol; az előnézete egy beágyazott `Preview`-val rendereli a belső blokkokat.

```svelte
<!-- NoteView.svelte -->
<script lang="ts" module>
	export interface NoteProps extends Record<string, unknown> {
		title: string;
	}
</script>

<script lang="ts">
	import { Frame, useText, type PluginViewProps } from '@atom-forge/brickee';

	let { props = $bindable(), blocks = $bindable(), readonly, palette, plugins }: PluginViewProps<NoteProps> = $props();
	const tr = useText();
</script>

<Frame bind:blocks {readonly} {palette} {plugins} heading={props.title} empty={tr('Note')} placeholder={tr('Write the note…')} />
```

```svelte
<!-- NotePreview.svelte -->
<script lang="ts">
	import { Preview, type PluginPreviewProps } from '@atom-forge/brickee';
	import type { NoteProps } from './NoteView.svelte';

	let { props, blocks, plugins }: PluginPreviewProps<NoteProps> = $props();
</script>

<aside class="note">
	{#if props.title}<p class="note-title">{props.title}</p>{/if}
	<Preview {blocks} {plugins} nested />
</aside>
```

```ts
// note.ts
import { StickyNote } from '@lucide/svelte';
import { mdJoin, mdQuote, mdText, type BlockPlugin } from '@atom-forge/brickee';
import NoteView, { type NoteProps } from './NoteView.svelte';
import NotePreview from './NotePreview.svelte';

export const note: BlockPlugin<NoteProps> = {
	type: 'note',
	label: 'Note',
	hint: 'Boxed text with a title',
	keys: 'note aside box',
	icon: StickyNote,
	props: () => ({ title: '' }),
	fields: [{ key: 'title', label: 'Title', kind: 'text' }],
	tag: () => 'note',
	content: 'blocks',
	accepts: ['md:p', 'md:ul', 'md:ol', 'youtube'],
	markdown: (p, { inner }) => mdQuote(mdJoin(p.title && `**${mdText(p.title)}**`, inner)),
	view: NoteView,
	preview: NotePreview
};
```

A `Frame` propsai: `blocks` (bindable), `readonly`, `palette`, `plugins`, és opcionálisan `placeholder` a beágyazott szerkesztőhöz. A `heading`, az `empty` és az `image` (egy URL) címsort hoz létre, amely csak akkor látszik, ha a mezők nem (csak olvasható módban, vagy ha nincsenek mezők).

Hogyan működik a beágyazás:

- **Egy szint.** A beágyazott szerkesztő soha nem kínál olyan blokkot, amely maga is blokkokat tartalmaz, sem egyedi blokkot. A séma elutasítja a mélyebb dokumentumokat.
- Az **`accepts`** a felsorolt palettaazonosítókra szűkíti azt, amit a beágyazott szerkesztő kínál, az alkalmazás sorrendjében. Az `'md:*'` az összes beépített blokkot jelenti, így a `['md:*', 'youtube']` jelentése „szöveg és videók”. `accepts` nélkül a beágyazott szerkesztő mindent kínál, amit az alkalmazás (a tárolók és az egyedi blokkok kivételével).
- Az alkalmazás `palette`-je továbbra is érvényes: az `accepts` csak szűkítheti, soha nem bővítheti.
- Blokkok tárolóba csomagolását az „Átalakítás” menüből, illetve egy tároló másikká alakítását csak akkor kínálja fel, ha a tároló minden bekerülő blokkot elfogad.
- A `blocksSchemaFor(plugins)` a szerveren ellenőrzi az `accepts`-et (lásd [A szerveren](server-side.md)).

## Egyedi blokkok

**`unique: true`** — dokumentumonként legfeljebb egy, a legfelső szinten (például egy tartalomjegyzék). Amint a dokumentumban van egy, a plugin eltűnik a perjeles és az „Átalakítás” menüből, a beillesztett második példány a markdown alakjára esik vissza, és beágyazott szerkesztő soha nem kínálja. A séma nem kényszeríti ki.

## Markdown alak

A `markdown(props, { inner })` markdownként adja vissza a blokkot; ezt használja a szerkesztő blokkok másolásakor, és a `toMarkdown`. Az `inner` a beágyazott blokkok, már markdownként (`''`, ha nincsenek).

`''` visszaadásával kihagyod a blokkot. Azoknak a pluginoknak, amelyek kimenetének szövegként nincs értelme (hirdetéshely, a mellékelt `gap`), egyszerűen nincs markdown alakjuk. Három segédfüggvény gondoskodik a jól formált kimenetről:

| Segédfüggvény | Mit csinál |
|---|---|
| `mdText(value)` | Markdownban biztonságos egyszerű szöveg: escape-eli a soron belüli jelöléseket és a `#`-et, összevonja a sorokat. |
| `mdJoin(...parts)` | Különálló blokkokként fűzi össze a részeket (köztük üres sorral), kihagyva az üreseket és a hamis értékűeket. |
| `mdQuote(md)` | Minden sor elé `> `-t tesz, idézetblokként renderelt dobozhoz. |

## Beillesztett táblázatok fogadása

Ha GFM-táblázatot tartalmazó markdownt illesztenek be a szerkesztőbe, vagy a `fromMarkdown(text, { plugins })` olvassa be, a táblázatot az első olyan plugin kapja, amelynek van `fromTable` függvénye. Megkapja a táblázatot, és visszaadja az új blokk propjait:

```ts
interface MarkdownTable {
	rows: string[][]; // a cellák inline markdownként, soronként; az első sor a fejléc
	align: ('left' | 'center' | 'right')[]; // oszloponként, az elválasztó sorból (:--, :-:, --:)
}

fromTable?(table: MarkdownTable): P;
```

A beépített `table` pluginnak van ilyen (`fromTable: ({ rows, align }) => ({ rows, heads: ['top'], align })`), így egy olyan szerkesztőbe beillesztett táblázat, amely felkínálja, táblázat blokk lesz. Ilyen plugin nélkül a táblázat szöveg marad.

## Inline pluginok

Az inline plugin egy blokk szövegén belüli elem – képlet, említés, változó –, amely egységként mozog és törlődik, miközben a tárolt szöveg inline markdown marad. Ugyanazt a listát add a szerkesztőnek és az előnézetnek (`inlinePlugins`); a beágyazott szerkesztők és a plugin-nézetek (egy táblázat cellái) kontextuson keresztül kapják meg (`useInlinePlugins()`).

```ts
interface InlinePlugin<D extends Record<string, string>> {
	type: string; label: string; icon: Icon;
	pattern: RegExp;                 // a markdown-alakja a szövegben (globális, korlátos)
	parse(match: string[]): D;       // találat → adat
	markdown(data: D): string;       // adat → markdown-alak (ennek parse-a ugyanazt az adatot adja)
	render(data: D): string;         // adat → biztonságos HTML (escape-eld, ami az adatból jön)
	fields: PropField[];             // kattintásra egy kis ablakban szerkeszthető
	create(text: string): D;         // új elem a kijelölt vagy begépelt szövegből
	typing?: { open: string; close: string }; // open…close és egy szóköz begépelése elemet csinál
}
```

Működése: az `inline()` a kódszakaszokon és az escape-elt karaktereken kívül keresi a mintákat, és a `render` HTML-jét egy olyan spanbe teszi, amely hordozza a markdown-alakot (`data-md`); a szerkesztőben ez a span nem szerkeszthető szöveg. A markdownra visszaalakítás a `data-md`-t veszi, így a dokumentum akkor is ugyanúgy mentődik, ha a plugin hiányzik (a markdown-alakja ilyenkor szövegként látszik). A formázósáv pluginonként kap egy gombot, az elemre kattintva megnyílnak a mezői, a `typing` pedig úgy működik, mint a `**félkövér**`. Az `@atom-forge/brickee/math` `inlineMath`-ja a mellékelt példa.

## Fájlok fogadása

Ha fájlokat illesztenek be a szerkesztőbe (egy kimásolt kép, egy képernyőkép), vagy az oldalon kívülről dobnak rá, a szerkesztő által felkínált pluginok közül az első, amelynek van `fromFiles` függvénye és propokat ad vissza, kap egy saját blokkot:

```ts
fromFiles?(files: File[]): P | null | Promise<P | null>;
```

`null`-lal a következő pluginra hagyja a fájlokat. A feltöltés és a tárolás a plugin dolga, ezért visszaadhat promise-t is – feltölt, majd a tárolt URL-lel vagy azonosítóval adja vissza a propokat. A beillesztett fájl a kurzort tartalmazó blokk után kerül (vagy egy üres blokk helyére), a bedobott oda, ahol a húzásjelző vonal mutatja.

```ts
fromFiles: async (files) => {
	const file = files.find((f) => f.type.startsWith('image/'));
	if (!file) return null;
	const url = await uploadToMyStorage(file); // az alkalmazásod feltöltése
	return { url, alt: file.name };
},
```

## A kit

| Export | Fajta | Használat |
|---|---|---|
| `Frame` | komponens | Egy tároló szerkesztőbeli kinézete: felül a mezők, alatta a beágyazott szerkesztő. |
| `Empty` | komponens | Olyan blokk helyőrzője, amelynek a propsa még nincs beállítva. |
| `safeColor(value, fallback)` | függvény | Egy `#hex` szín (3–8 számjegy), vagy a tartalék érték. |
| `lines(text)` | függvény | Levágott, nem üres sorok: a mező `parse`-a „soronként egy” listákhoz. |
| `mdText`, `mdJoin`, `mdQuote` | függvények | Markdown alakok (fent). |
| `useText` | függvény | Lefordítja a plugin saját felületi szövegeit. |
| `Preview` | komponens | Egy tároló beágyazott blokkjait rendereli (`nested`-del). |
