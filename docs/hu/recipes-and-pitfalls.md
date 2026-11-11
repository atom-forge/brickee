# Receptek és buktatók

[← Előző](server-side.md) · [Tartalom](index.md) · [Következő →](upgrading.md)

## Egy hely a blokkbeállításoknak

Egy alkalmazás pluginjait, palettáit és szövegeit tartsd egyetlen modulban, a szerkesztőt pedig csomagold be egy saját komponensbe. Az oldalak ezután a csomagolót használják, és soha nem ismétlik meg a beállítást.

```ts
// lib/blocks.ts
import type { BlockPlugin, Messages } from '@atom-forge/brickee';
import * as base from '@atom-forge/brickee/plugins';
import { hu } from '@atom-forge/brickee/locales/hu';
import SiteYouTube from './SiteYouTube.svelte';
import { photo } from './photo';
import { button } from './button';

const withPreview = (plugin: BlockPlugin, preview: BlockPlugin['preview']): BlockPlugin => ({ ...plugin, preview });

export const plugins: BlockPlugin[] = [
	withPreview(base.youtube, SiteYouTube),
	base.table,
	base.map,
	base.gap,
	photo,
	button
];

/** A teljes paletta, az oldal saját lapjainak szerkesztőihez. */
export const PAGE_PALETTE = ['md:p', 'md:h2', 'md:h3', 'md:ul', 'md:ol', 'md:quote', 'md:hr', ...plugins.map((p) => p.type)];

/** Egy kisebb, a felhasználói hozzászólásokhoz. */
export const COMMENT_PALETTE = ['md:p', 'md:ul', 'md:ol', 'md:quote', 'photo'];

export const messages: Messages = { ...hu, Button: 'Gomb', 'A link as a button': 'Egy link gombként' };
```

```svelte
<!-- lib/BlockEditor.svelte -->
<script lang="ts">
	import { Editor, provideView, type StoredBlock } from '@atom-forge/brickee';
	import { messages, PAGE_PALETTE, plugins } from './blocks';

	let {
		value = $bindable(),
		palette = PAGE_PALETTE,
		view
	}: { value: StoredBlock[]; palette?: string[]; view?: string } = $props();

	provideView(() => view);
</script>

<Editor bind:value {plugins} {palette} {messages} />
```

A közzétett oldalt a `<Preview blocks={doc} {plugins} {messages} />`-val és ugyanazokkal a `plugins`-szal rendereld, így egy blokk ugyanúgy néz ki a szerkesztő előnézetében és az oldalon.

## A teljes dokumentum másolása markdownként

A kijelölt blokkok másolása már most is markdownt tesz a vágólapra. Egy, a teljes dokumentumot másoló „Copy as markdown” gombhoz:

```svelte
<script lang="ts">
	import { fromStored, toMarkdown, type StoredBlock } from '@atom-forge/brickee';
	import { plugins } from './blocks';

	let { doc }: { doc: StoredBlock[] } = $props();

	// Kattintáskezelőben fut, így a csak böngészőben működő toMarkdown itt biztonságos.
	const copy = () => navigator.clipboard.writeText(toMarkdown(doc.map(fromStored), { plugins }));
</script>

<button type="button" onclick={copy}>Copy as markdown</button>
```

## Dokumentum indítása markdownból

```ts
import { fromMarkdown, toStored, type StoredBlock } from '@atom-forge/brickee';

// Böngészőben: a toStored a DOM-on keresztül olvassa be a soron belüli HTML-t.
export const fromText = (text: string): StoredBlock[] => fromMarkdown(text).map(toStored);
```

Egy bekezdés sorai egy blokk maradnak, köztük sortöréssel; üres sor új blokkot kezd.

## Fejlesztés helyi másolattal

Ha a csomag egy helyi checkoutját linkeled be egy alkalmazásba (`bun link`), a linkelt mappa a saját `node_modules`-át hozza magával. Vedd rá a Vite-ot, hogy a közös csomagokból az alkalmazás egyetlen példányát használja, különben a Svelte-kontextusok — a popupkezelő, a téma — nem találhatók meg a két példány között:

```ts
// az alkalmazás vite.config.ts-e
export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		dedupe: ['svelte', '@atom-forge/ui', '@lucide/svelte', 'zod']
	}
});
```

Az alkalmazás a csomag lefordított `dist/` mappáját olvassa, ezért minden változtatás után buildeld újra a csomagot.

## Buktatók

| Tünet | Ok | Megoldás |
|---|---|---|
| A szerkesztő sorai, menüi vagy táblázata stílus nélküliek vagy összezsugorodnak | Az `@atom-forge/brickee` `dist` mappája nem Tailwind `@source` | Vedd fel az `@source "../node_modules/@atom-forge/brickee/dist";` sort az `@atom-forge/ui`-é mellé. |
| A blokkmezők és a popupok stílus nélkülinek tűnnek | Hiányzik az `@atom-forge/ui` téma CSS-e vagy a Tailwind `@source`-a | Állítsd be az `@atom-forge/ui`-t a dokumentációja szerint, és az alkalmazást a `Root`-ja alatt rendereld. |
| A blokkfogantyúk balra kilógnak | A fogantyúk a szerkesztő dobozától balra jelennek meg | Adj a szerkesztőt körülvevő elemnek kb. 22 px bal oldali paddinget. |
| A popupok nem nyílnak meg, vagy „context not found” hibák linkelt csomaggal | A `svelte` vagy az `@atom-forge/ui` két példányban van jelen | Vedd fel őket a Vite `resolve.dedupe` listájába. |
| Egy plugin blokkja „Unknown block” feliratot mutat | A pluginja hiányzik a `plugins`-ból | Egy dokumentumtípus minden szerkesztőjének és előnézetének ugyanazokat a pluginokat add át. |
| Egy blokk hiányzik a `Preview`-ból | A pluginjának nincs `preview`-ja | Adj a pluginnak `preview`-t (a mellékelt pluginoknak van alapértelmezett), vagy rendereld a blokkot a saját megjelenítőddel. |
| Egy plugin blokkja hiányzik az oldalról | Az előnézet más `plugins`-t kapott | Ugyanazt a pluginlistát használd a szerkesztőhöz és az előnézethez. |
| Egy képblokk semmit sem renderel | Az előnézete elutasítja a tárolt címet, vagy az alkalmazás saját keresése nem ismeri a tárolt azonosítót | Olyan címet tárolj, amelyet az előnézet elfogad (`http(s)` vagy az oldalon belüli); az azonosítókat a szerkesztőben és az oldalon ugyanabból az adatból oldd fel. |
| Egy doboz nem tehető egy másik dobozba | A beágyazott szerkesztők egy szint mélyek | A tárolókat tartalomblokkok befogadására tervezd, ne más tárolókéra. |
| Egy blokk nem érhető el egy tárolón belül | Az `accepts` vagy az alkalmazás `palette`-je kihagyja | Vedd fel a palettaazonosítót az `accepts`-be (vagy használd az `'md:*'`-ot az összes beépítetthez). |
| Egy egyedi blokk kétszer jelenik meg | A séma nem kényszeríti ki a `unique`-ot | Ellenőrizd a szerveren, ha az alkalmazásod számít rá. |
| `document is not defined` | A `toMarkdown` vagy a `toStored` SSR közben futott | Csak a böngészőben hívd őket. |
| Egy propsból jövő szín vagy link elrontja az oldalt | A props felhasználói bemenet | Használd a `safeColor`-t, ellenőrizd a linkeket, és propsszal soha ne használj `{@html}`-t. |
| Egy felülírt plugin elveszíti a blokkjait | Megváltozott a `type`-ja | Egy plugin szétterítésekor tartsd meg a `type`-ot. |
| `bind:blocks` hiba egy saját nézetben | A `props` vagy a `blocks` nincs bindable-ként deklarálva | Deklaráld mindkettőt `$bindable()`-lel. |
| Az érték soha nem üres tömb | A szerkesztő üres dokumentumnál egy üres bekezdést mutat (és ír) | Az olyan dokumentumot, amelyben csak üres bekezdések vannak, kezeld üresként, például a `blocksToPlainText(doc).trim() === ''` segítségével. |
| Az előnézet nem követi a szerkesztő görgetését | Az actionök nem a görgethető dobozokon vannak | A `use:sync.source` / `use:sync.target` közvetlenül az `overflow` dobozokra kerüljön. |
