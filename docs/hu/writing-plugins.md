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
| `tag` | `(props: P) => string` | A blokk tetején, a mezői előtt álló kis címke. A ` · `-tal elválasztott részeit egyenként fordítja le. |
| `content` | `'none' \| 'text' \| 'plain' \| 'blocks'` | Mit tartalmaz a blokk. A pluginok `'none'`-t (csak props) vagy `'blocks'`-ot (beágyazott dokumentum) használnak; ez dönti el, mit kínál az „Átalakítás” menü. |
| `view` | `Component<PluginViewProps>` | A blokk a szerkesztőben. |
| `preview` | `Component<PluginPreviewProps>` | A blokk az oldalon (opcionális). Nélküle a `Preview` semmit sem renderel a blokkhoz — saját megjelenítővel dolgozó alkalmazásoknak. |
| `accepts` | `string[]` | Egy tároló blokk megengedett beágyazott blokkjai, palettaazonosítókként; az `'md:*'` az összes beépített blokk. Alapértelmezés: minden, amit az alkalmazás kínál. |
| `markdown` | `(props: P, ctx: MarkdownContext) => string` | A markdown alakja (opcionális). |
| `unique` | `boolean` | Dokumentumonként legfeljebb egy, csak a legfelső szinten. |
| `gate` | `boolean` | Az utána következő blokkok védettek; az előnézet megjelöli őket. |

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
| `views` | Nézetenkénti értékek egy `slider`-hez (lásd [Nézetenkénti értékek](host-contexts.md#nézetenkénti-értékek)). |
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

Az előnézet `PluginPreviewProps`-ot kap: `props`, `blocks` és `plugins`. Ez egy egyszerű Svelte-komponens, amely az oldal számára rendereli a blokkot. A szövegek és a nézet a kontextusokon keresztül érhető el (`useText`, `useView`; lásd [Az alkalmazás kontextusai](host-contexts.md)); a képek a plugin saját ügyei (lásd [Képek](#képek)).

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

## Egyedi és kapus blokkok

- **`unique: true`** — dokumentumonként legfeljebb egy, a legfelső szinten. Amint a dokumentumban van egy, a plugin eltűnik a perjeles és az „Átalakítás” menüből; beágyazott szerkesztő soha nem kínálja.
- **`gate: true`** — az első legfelső szintű kapus blokk utáni blokkok védettek. A `Preview` egy „For supporters only” jelölésű, szaggatott vonallal elválasztott szakaszban rendereli őket; a `markGated={false}` kikapcsolja a jelölést. A beágyazott előnézetek soha nem osztódnak ketté.

Mindkettőre tipikus példa egy csak támogatóknak szóló elválasztó: dokumentumonként egy, mögötte a védett tartalommal.

> **A kapu csak jelöl**
>
> A `gate` semmit sem rejt el: az előnézet továbbra is minden blokkot renderel, és a tárolt dokumentum is mindet tartalmazza. Annak eldöntése, hogy ki olvashatja a védett részt — és hogy mindenki más elől kimaradjon az oldalról —, az alkalmazás feladata, a szerveren (lásd [Védett tartalom](server-side.md#védett-tartalom)). A `unique`-ot a séma sem kényszeríti ki.

## Markdown alak

A `markdown(props, { inner })` markdownként adja vissza a blokkot; ezt használja a szerkesztő blokkok másolásakor, és a `toMarkdown`. Az `inner` a beágyazott blokkok, már markdownként (`''`, ha nincsenek).

`''` visszaadásával kihagyod a blokkot. Azoknak a pluginoknak, amelyek kimenetének szövegként nincs értelme (hirdetéshely, a mellékelt `gap`), egyszerűen nincs markdown alakjuk. Három segédfüggvény gondoskodik a jól formált kimenetről:

| Segédfüggvény | Mit csinál |
|---|---|
| `mdText(value)` | Markdownban biztonságos egyszerű szöveg: escape-eli a soron belüli jelöléseket és a `#`-et, összevonja a sorokat. |
| `mdJoin(...parts)` | Különálló blokkokként fűzi össze a részeket (köztük üres sorral), kihagyva az üreseket és a hamis értékűeket. |
| `mdQuote(md)` | Minden sor elé `> `-t tesz, idézetblokként renderelt dobozhoz. |

## Képek

A szerkesztő nem ismeri a kép fogalmát: nincs képmező, nincs képválasztó, nincs médialista. Hogy egy blokk a kép URL-jét vagy az alkalmazás saját médiatárában lévő kép azonosítóját tárolja, hogyan választja ki a felhasználó, és hogyan lesz a tárolt értékből cím, az az alkalmazás döntése, így a képblokk az alkalmazás egy közönséges pluginja.

Egy minimális `photo` plugin a kép címét tárolja, amelyet egy szövegmezőbe kell beírni, mellette alternatív szöveggel és magasságcsúszkával:

```svelte
<!-- PhotoView.svelte -->
<script lang="ts" module>
	export interface PhotoProps extends Record<string, unknown> {
		/** A kép címe. */
		url: string;
		alt: string;
		/** A magasság a szélesség %-ában (20–150), vagy beállítatlan a kép saját alakjához. */
		ratio?: unknown;
	}

	/** A tárolt cím, ha http(s) vagy az oldalon belüli, különben ''. */
	export const imageSrc = (u: unknown) => {
		const s = String(u ?? '').trim();
		return /^(https?:|\/(?!\/))/.test(s) ? s : '';
	};

	/** CSS aspect-ratio egy tárolt magasságból, vagy undefined. */
	export const aspect = (v: unknown) => {
		const n = Number(v);
		return n >= 20 && n <= 150 ? `100 / ${n}` : undefined;
	};
</script>

<script lang="ts">
	import { ImageIcon } from '@lucide/svelte';
	import { Empty, type PluginViewProps } from '@atom-forge/brickee';

	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<PhotoProps> = $props();
	const src = $derived(imageSrc(props.url));
</script>

{#if src}
	<img {src} alt={props.alt} style="max-width: 100%" />
{:else}
	<Empty icon={ImageIcon} text="Set the image's address above" />
{/if}
```

```svelte
<!-- PhotoPreview.svelte -->
<script lang="ts">
	import { baseValue, type PluginPreviewProps } from '@atom-forge/brickee';
	import { aspect, imageSrc, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const src = $derived(imageSrc(props.url));
</script>

{#if src}
	<img {src} alt={props.alt ?? ''} style:aspect-ratio={aspect(baseValue(props.ratio))} />
{/if}

<style>
	img {
		width: 100%;
		object-fit: cover;
	}
</style>
```

```ts
// photo.ts
import { ImageIcon } from '@lucide/svelte';
import { mdText, type BlockPlugin } from '@atom-forge/brickee';
import PhotoView, { type PhotoProps } from './PhotoView.svelte';
import PhotoPreview from './PhotoPreview.svelte';

export const photo: BlockPlugin<PhotoProps> = {
	type: 'photo',
	label: 'Photo',
	hint: 'One image',
	keys: 'photo image picture',
	icon: ImageIcon,
	props: () => ({ url: '', alt: '' }),
	fields: [
		{ key: 'url', label: 'Image', kind: 'text', placeholder: 'https://…', parse: (s) => s.trim() },
		{ key: 'alt', label: 'Alt text', kind: 'text', placeholder: 'What the image shows' },
		{ key: 'ratio', label: 'Height', kind: 'slider', min: 20, max: 150, unit: '%', none: 'Original' }
	],
	tag: () => 'photo',
	content: 'none',
	markdown: (p) => {
		const src = imageSrc(p.url);
		return src ? `![${mdText(p.alt)}](${src})` : '';
	},
	view: PhotoView,
	preview: PhotoPreview
};
```

A cím ugyanolyan prop, mint a többi, tehát megbízhatatlan: a nézet és az előnézet csak akkor rendereli, ha `http(s)` vagy az oldalon belüli cím, ahogy a gomb is ellenőrzi a linkjét.

Más alkalmazások másként döntenek, de mindezt a pluginon belül:

- **Médiatár.** A blokk URL helyett az alkalmazás médiatárában lévő kép azonosítóját tárolja. A nézet, az előnézet és a `markdown` az alkalmazás saját keresésével alakítja címmé az azonosítót: az alkalmazás egy moduljával, vagy egy saját Svelte-kontextussal, amelyet a szerkesztő és az előnézet fölött ad meg (a plugin-komponensek ezek alatt renderelődnek). A `markdown` komponenseken kívül fut — blokkok másolásakor és a `toMarkdown`-ban —, ezért csak modulbeli adatot használhat.
- **Kiválasztás.** Szövegmező helyett a nézet saját választót is mutathat — egy gombot, amely megnyitja az alkalmazás médiaablakát vagy egy feltöltést —, és az eredményt a `props`-ba írja, amely kötött (bindable).
- **Több kép.** Egy galéria egyetlen propban tárol egy listát (URL-ekből vagy azonosítókból), és ugyanígy a nézetében szerkeszti.

## A kit

| Export | Fajta | Használat |
|---|---|---|
| `Frame` | komponens | Egy tároló szerkesztőbeli kinézete: felül a mezők, alatta a beágyazott szerkesztő. |
| `Empty` | komponens | Olyan blokk helyőrzője, amelynek a propsa még nincs beállítva. |
| `safeColor(value, fallback)` | függvény | Egy `#hex` szín (3–8 számjegy), vagy a tartalék érték. |
| `lines(text)` | függvény | Levágott, nem üres sorok: a mező `parse`-a „soronként egy” listákhoz. |
| `baseValue(value)` | függvény | Egy nézetenkénti prop alapértéke. |
| `viewValues(value, keys)` | függvény | Egy nézetenkénti prop értéke minden nézetre. |
| `mdText`, `mdJoin`, `mdQuote` | függvények | Markdown alakok (fent). |
| `useText` | függvény | Lefordítja a plugin saját felületi szövegeit. |
| `useView` | függvény | Az alkalmazás által éppen mutatott nézet. |
| `Preview` | komponens | Egy tároló beágyazott blokkjait rendereli (`nested`-del). |
