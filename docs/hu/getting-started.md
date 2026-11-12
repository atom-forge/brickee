# Első lépések

[Tartalom](index.md) · [Következő →](editor-and-preview.md)

## Mi a Brickee

A Brickee blokkszerkesztő: a dokumentum blokkok listája, mindegyik a saját sorában szerkeszthető, húzással átrendezhető, és a fogantyújáról más típusúvá alakítható. A magban lévő blokkok markdown blokkok — bekezdések, hat címsorszint, felsorolás, számozott lista és teendőlista, idézetek, kód és elválasztók —, így egy pluginok nélküli dokumentum sima markdownként olvasható és másolható.

Minden más plugin. A plugin egy egyszerű objektum (`BlockPlugin`), amely megnevez egy blokktípust, és a következőket adja hozzá:

- egy **nézetet** — a szerkesztőben megjelenő Svelte-komponenst;
- egy **előnézetet** — a blokkot az oldalon megjelenítő Svelte-komponenst;
- **mezőket** — a blokk tetején megjelenő beállításokat (szöveg, szín, választó, csúszka…);
- opcionálisan egy **markdown alakot**, amelyet a dokumentum markdownként való másolásakor vagy exportálásakor használ.

A csomag négy általános plugint is tartalmaz — táblázat, YouTube-videó, térkép és térköz —, de ezek is ugyanolyan pluginok, mint bármelyik más: a magban semmi sem függ tőlük, és csak azokat adod át, amelyeket szeretnél. A képblokkokat, dobozokat és más, az oldalra jellemző blokkokat te írod meg pluginként.

## Telepítés

```sh
bun add @atom-forge/brickee @atom-forge/ui @lucide/svelte
```

| Peer dependency | Miért |
|---|---|
| `svelte` `^5.0.0` | A szerkesztő, az előnézet és a pluginok Svelte 5 komponensek. |
| `@atom-forge/ui` `>=0.1.0` | A felugró ablakok (linkbekérő), a blokkmezők űrlapvezérlői és a szerkesztő menüinek lebegőrétege. |
| `@lucide/svelte` `>=1.0.0` | A blokkok ikonjai. |
| `zod` `^4.0.0` (opcionális) | Csak az `@atom-forge/brickee/schema` szerveroldali sémájához. |

## A befogadó alkalmazás beállítása

A blokkmezők és a felugró ablakok `@atom-forge/ui` komponensek, ezért az alkalmazást úgy kell beállítani, ahogy az `@atom-forge/ui` megköveteli:

- Tailwind CSS 4, importált `@atom-forge/ui` téma-CSS-sel, a `dist` mappáját pedig add hozzá Tailwind `@source`-ként;
- az `@atom-forge/brickee` `dist` mappája is legyen Tailwind `@source`: a szerkesztő Tailwind-osztályokkal és az `@atom-forge/ui` téma színeivel van stílusozva, ezért a Tailwindnek látnia kell őket:

  ```css
  @source "../node_modules/@atom-forge/ui/dist";
  @source "../node_modules/@atom-forge/brickee/dist";
  ```

  Az előnézetnek egyik sem kell: a kevés stílusa a jelölésével együtt utazik, így Tailwind nélküli nyilvános oldal is mutathat dokumentumokat;
- az alkalmazás az `@atom-forge/ui` `Root` komponense alatt renderelődjön, amely a témát és az overlay-kontextusokat biztosítja.

A legfelső szintű `Editor` saját felugróablak-kezelőt hoz létre, és saját felugróablak-tárolót renderel; a pluginblokkokba ágyazott szerkesztők ezt használják közösen.

A szerkesztő lebegő menüi (az eszköztár, a perjeles és az „Átalakítás” menü) abba a lebegőrétegbe kerülnek, amelyet a `Root` az ablakok (modal) és a fiókok (drawer) fölé renderel, a felugró ablakai pedig a menük fölé. A szerkesztő ezért `@atom-forge/ui` ablakban vagy fiókban is működik, és az `Esc` egy nyitott menün vagy linkmezőn csak azt zárja be (lásd [Szerkesztés](editor-and-preview.md#szerkesztés)).

A szerkesztő a színeit az `@atom-forge/ui` téma tokenjeiből veszi (`--color-surface`, `--color-frame`, `--color-muted-contrast`…), így követi a befogadó alkalmazás világos és sötét módját. Az előnézet keretei és képaláírásai az oldal szövegszínéből számolódnak.

A blokkok fogantyúi a **szerkesztő dobozától balra**, egy kb. 22 px széles sávban jelennek meg: a szerkesztőt körülvevő elemnek legyen ennyi bal oldali paddingje, különben a fogantyúk kilógnak belőle.

> **Hiányzó téma**
>
> Az `@atom-forge/ui` téma-CSS nélkül a szerkesztő továbbra is működik, de a blokkmezők, a színválasztó, a csúszka és a felugró ablakok stílus nélkül jelennek meg.

Az előnézet csak azt a kevés stílust adja hozzá, amelyre saját magának szüksége van (teendő-jelölőnégyzetek, képszélességek, körbefuttatás). A címsorok, bekezdések és listák tipográfiája az előnézetet megjelenítő oldalról jön.

## Egy első szerkesztő

```svelte
<script lang="ts">
	import { Editor, Preview, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value plugins={PLUGINS} />

<article>
	<Preview blocks={value} plugins={PLUGINS} />
</article>
```

- A `value` a dokumentum JSON-ként (`StoredBlock[]`). A szerkesztő minden változáskor visszaírja; mentsd el úgy, ahogy van.
- A `plugins` felsorolja azokat a pluginblokkokat, amelyeket a szerkesztő megjeleníthet és felkínálhat. Ha elhagyod, egyszerű markdown-szerkesztőt kapsz.
- A `Preview` ugyanazt a dokumentumot ugyanazokkal a pluginokkal rendereli, úgy, ahogy az oldal megjeleníti.

Üres sorban gépelj `/` jelet a blokkmenü megnyitásához.

## Belépési pontok

| Import | Tartalom |
|---|---|
| `@atom-forge/brickee` | `Editor`, `Preview`, a kit (`Frame`, `Empty`, segédfüggvények), a tárolt alak, a markdown-átalakítások, a kontextusok, a paletta, a típusok. |
| `@atom-forge/brickee/plugins` | A mellékelt pluginok (`table`, `youtube`, `map`, `gap`), a mind a négyet tartalmazó `PLUGINS` és a segédfüggvényeik. |
| `@atom-forge/brickee/schema` | `blocksSchema` és `blocksSchemaFor` (zod), szerveroldali validáláshoz. |
| `@atom-forge/brickee/model` | A tárolt alak Svelte nélkül: `StoredBlock`, `MD`, `isMd`, `acceptsId`, `blocksToPlainText`… |
| `@atom-forge/brickee/locales/hu` | `hu`: a magyar felületi szövegek. |

> **Csak az kerül a bundle-be, amit importálsz**
>
> A mellékelt pluginok saját belépési ponton érhetők el. Az az alkalmazás, amely csak az `@atom-forge/brickee`-t importálja, a markdown-szerkesztőt kapja, pluginkód nélkül.
