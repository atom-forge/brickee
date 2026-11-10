# Dokumentumok és markdown

[← Előző](editor-and-preview.md) · [Tartalom](index.md) · [Következő →](bundled-plugins.md)

## A tárolt alak

A dokumentum `StoredBlock` objektumok tömbje: egyszerű JSON, amelyet úgy, ahogy van, elmenthetsz egy adatbázis-oszlopba:

```ts
interface StoredBlock {
	type: string; // beépített blokkoknál 'md:p', 'md:h2'…; plugin-blokkoknál a plugin típusa
	indent: number; // 0–6
	text?: string; // beépített blokkok: inline markdown (md:code esetén nyers szöveg)
	props?: Record<string, unknown>; // plugin-beállítások; md:todo { checked }, md:code { lang }
	blocks?: StoredBlock[]; // beágyazott blokkokat tartalmazó pluginok: a belső dokumentumuk
}
```

Egy rövid dokumentum egy bekezdéssel, egy listával, egy videóval és egy dobozzal (a [Pluginok írása](writing-plugins.md#tárolók) `note` tárolójával):

```json
[
	{ "type": "md:h2", "indent": 0, "text": "Getting there" },
	{ "type": "md:p", "indent": 0, "text": "Take the **night train** or see the [timetable](https://example.com/trains)." },
	{ "type": "md:ul", "indent": 0, "text": "Tickets online" },
	{ "type": "md:ul", "indent": 1, "text": "Students get *20%* off" },
	{ "type": "youtube", "indent": 0, "props": { "id": "aqz-KE-bpKQ", "title": "The route by night" } },
	{
		"type": "note",
		"indent": 0,
		"props": { "title": "Good to know" },
		"blocks": [{ "type": "md:p", "indent": 0, "text": "Trains are cancelled on public holidays." }]
	}
]
```

- A beépített típusok `md:` előtagot kapnak (`MD` konstans, `isMd(block)` vizsgálat); minden más plugin-típus.
- A plugin-blokkok csak a `type`, az `indent`, a `props` és – tárolóknál – a `blocks` mezőt őrzik meg. Hogy a props mit jelent, az a pluginon múlik.
- A beágyazás egy szint mély: egy dobozon belüli blokk maga már nem tartalmazhat blokkokat (a `MAX_DEPTH` értéke 2).
- A szerkesztő saját munkaalakja (`Block`, `id`-vel és inline HTML-lel) soha nem kerül tárolásra; a kettő között a `toStored` és a `fromStored` alakít át.

## Beépített blokkok

| Típus | Tárolt szöveg | Props | Markdown |
|---|---|---|---|
| `md:p` | inline markdown | — | maga a szöveg |
| `md:h1` … `md:h6` | inline markdown | — | `#` … `######` |
| `md:ul` | inline markdown | — | `- item` |
| `md:ol` | inline markdown | — | `1. item` (sorozatonként és behúzási szintenként számozva) |
| `md:todo` | inline markdown | `{ checked: boolean }` | `- [x] item` |
| `md:quote` | inline markdown | — | `> quote` |
| `md:code` | nyers szöveg | `{ lang?: string }` | kerített blokk a nyelvvel |
| `md:hr` | — | — | `---` |

Az `indent` egymásba ágyazza a listaelemeket (az egymást követő lista-blokkokból az előnézetben helyesen egymásba ágyazott `ul`/`ol` elemek lesznek), a bekezdéseket és az idézeteket pedig behúzza. A címsorok, a kódblokkok és az elválasztók figyelmen kívül hagyják.

### Inline markdown

A beépített blokkok szövege a markdown egy kicsi, biztonságos részhalmaza:

| Jelölés | Tárolt alak |
|---|---|
| félkövér | `**text**` |
| dőlt | `*text*` |
| aláhúzott, alsó index, felső index | `<u>text</u>`, `<sub>text</sub>`, `<sup>text</sup>` |
| áthúzott | `~~text~~` |
| kód | `` `text` `` |
| hivatkozás | `[text](url)` – csak a `http:`, `https:`, `mailto:`, `tel:` és a webhelyen belüli `/…` célok lesznek hivatkozások |
| sortörés | egy újsor karakter |

Az egyszerű szövegben a speciális karakterek visszaperjeles escape-elést kapnak, így soha nem válnak jelöléssé. Az `inline(md)` az inline markdownt HTML-lé alakítja: előbb escape-eli a szöveget, és csak utána teszi hozzá a fenti tageket, így a kimenete biztonságosan megjeleníthető `{@html}`-lel – az előnézet is így tesz.

## Markdown be és ki

A markdown teljes értékű formátum: a vágólap ezt hordozza, és a befogadó alkalmazás importálhatja és exportálhatja.

| Függvény | Miből → mibe | Hol fut |
|---|---|---|
| `fromStored(block)` | `StoredBlock` → `Block` | bárhol |
| `toStored(block)` | `Block` → `StoredBlock` | csak böngészőben |
| `fromMarkdown(text)` | markdown → `Block[]` | bárhol |
| `toMarkdown(blocks, { plugins, media })` | `Block[]` → markdown | csak böngészőben |
| `inline(md)` | inline markdown → inline HTML | bárhol |

A markdown-függvények a szerkesztő alakján (`Block[]`) dolgoznak, ezért a tárolt dokumentumok a `fromStored` és a `toStored` függvényen mennek át:

```ts
import { fromMarkdown, fromStored, toMarkdown, toStored, type MediaItem, type StoredBlock } from '@atom-forge/brickee';
import { PLUGINS } from '@atom-forge/brickee/plugins';

// Tárolt dokumentum -> markdown (csak böngészőben).
export const exportMarkdown = (doc: StoredBlock[], media: MediaItem[]) =>
	toMarkdown(doc.map(fromStored), { plugins: PLUGINS, media });

// Markdown -> tárolt dokumentum (csak böngészőben).
export const importMarkdown = (text: string): StoredBlock[] => fromMarkdown(text).map(toStored);
```

> **Csak böngészőben**
>
> A `toMarkdown` és a `toStored` a DOM-on keresztül olvassa a szerkesztő inline HTML-jét, ezért szüksége van a `document`-re. A böngészőben hívd őket (eseménykezelőben, effectben), ne szerveroldali renderelés közben. Szerveroldali szöveghez a `blocksToPlainText`-et használd (lásd [A szerveren](server-side.md)).

Amit a `fromMarkdown` beolvas:

- címsorok, felsorolás-, számozott és teendő-elemek, idézetek, kerített kódblokkok a nyelvükkel, elválasztók és a fenti inline jelölések;
- a sor eleji szóközök behúzásként (szintenként két szóköz vagy egy tabulátor);
- minden nem üres sor külön blokként – a tördelt sorokat nem vonja össze egy bekezdéssé, és csak beépített blokkokat hoz létre (táblázatot, képet vagy plugin-blokkot nem).

Amit a `toMarkdown` kiír:

- az egymást követő listaelemeket egymást követő sorokba, minden más blokkot üres sorral elválasztva;
- a listaelemeket és a bekezdéseket szintenként két szóközzel behúzva;
- a plugin-blokkot a pluginja `markdown(props, { inner, media })` függvényével, ahol az `inner` a már átalakított beágyazott blokkjai; a markdown alak nélküli plugin, illetve az, amelyik `''`-t ad vissza, kimarad.

Saját pluginod markdown alakjának megírásáról a [Pluginok írása](writing-plugins.md#markdown-alak) fejezet szól.
