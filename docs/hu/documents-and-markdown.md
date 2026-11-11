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
| `md:ol` | inline markdown | `{ start?: number }` a lista első elemén | `1. item` (sorozatonként és behúzási szintenként számozva, megadott `start`-tól) |
| `md:todo` | inline markdown | `{ checked: boolean }` | `- [x] item` |
| `md:quote` | inline markdown | — | `> quote` |
| `md:code` | nyers szöveg | `{ lang?: string }` | kerített blokk a nyelvvel |
| `md:hr` | — | — | `---` |

Az `indent` egymásba ágyazza a listaelemeket (az egymást követő lista-blokkokból az előnézetben helyesen egymásba ágyazott `ul`/`ol` elemek lesznek), a bekezdéseket és a kódblokkokat egy listaelem alá teszi, az idézeteket pedig egymásba ágyazza (`> > …`). A címsorok és az elválasztók figyelmen kívül hagyják.

### Inline markdown

A beépített blokkok szövege a markdown egy kicsi, biztonságos részhalmaza:

| Jelölés | Tárolt alak |
|---|---|
| félkövér | `**text**` (beolvasva a `__text__` is) |
| dőlt | `*text*` (beolvasva a `_text_` is, szón belül nem) |
| aláhúzott, alsó index, felső index | `<u>text</u>`, `<sub>text</sub>`, `<sup>text</sup>` |
| áthúzott | `~~text~~` |
| kód | `` `text` `` (hosszabb backtick-sorozattal, ha a kód backticket tartalmaz: ``` `` a`b `` ```) |
| hivatkozás | `[text](url)` – csak a `http:`, `https:`, `mailto:`, `tel:` és a webhelyen belüli `/…` célok lesznek hivatkozások; a célban a zárójeleknek párosnak kell lenniük. Beolvasva a cím (elhagyva), a `<https://…>` autolink és a kép (`![alt](url)`) hivatkozásként is |
| sortörés | egy újsor karakter (markdown-kimenetben: visszaperjel a sor végén) |

Az egyszerű szövegben a speciális karakterek visszaperjeles escape-elést kapnak, így soha nem válnak jelöléssé; bármely ASCII írásjel escape-elhető. A beolvasás bármilyen bemeneten lineáris időben fut, ezekkel a korlátokkal: egy jelölt szakasz legfeljebb 2000 karakter, egy link címkéjében nem lehet saját szögletes zárójel, és legfeljebb 1000 karakter, egy link célja legfeljebb 2000. Beolvasáskor az inline HTML a jelölésekre képeződik le (`<strong>`, `<em>`, `<del>`, `<br>`…), a többi tag elmarad (a szövege megmarad), a `[^1]` lábjegyzet-hivatkozásból pedig felső index lesz. Az `inline(md)` az inline markdownt HTML-lé alakítja: előbb escape-eli a szöveget, és csak utána teszi hozzá a fenti tageket, így a kimenete biztonságosan megjeleníthető `{@html}`-lel – az előnézet is így tesz.

## Markdown be és ki

A markdown teljes értékű formátum: a vágólap ezt hordozza, és a befogadó alkalmazás importálhatja és exportálhatja.

| Függvény | Miből → mibe | Hol fut |
|---|---|---|
| `fromStored(block)` | `StoredBlock` → `Block` | bárhol |
| `toStored(block)` | `Block` → `StoredBlock` | csak böngészőben |
| `fromMarkdown(text, { plugins })` | markdown → `Block[]` | bárhol |
| `fromHtml(html, { plugins })` | HTML (formázott beillesztés, egy oldal) → `Block[]` | csak böngészőben |
| `toMarkdown(blocks, { plugins })` | `Block[]` → markdown | csak böngészőben |
| `inline(md)` | inline markdown → inline HTML | bárhol |

A markdown-függvények a szerkesztő alakján (`Block[]`) dolgoznak, ezért a tárolt dokumentumok a `fromStored` és a `toStored` függvényen mennek át:

```ts
import { fromMarkdown, fromStored, toMarkdown, toStored, type StoredBlock } from '@atom-forge/brickee';
import { PLUGINS } from '@atom-forge/brickee/plugins';

// Tárolt dokumentum -> markdown (csak böngészőben).
export const exportMarkdown = (doc: StoredBlock[]) => toMarkdown(doc.map(fromStored), { plugins: PLUGINS });

// Markdown -> tárolt dokumentum (csak böngészőben).
export const importMarkdown = (text: string): StoredBlock[] => fromMarkdown(text).map(toStored);
```

> **Csak böngészőben**
>
> A `toMarkdown` és a `toStored` a DOM-on keresztül olvassa a szerkesztő inline HTML-jét, ezért szüksége van a `document`-re. A böngészőben hívd őket (eseménykezelőben, effectben), ne szerveroldali renderelés közben. Szerveroldali szöveghez a `blocksToPlainText`-et használd (lásd [A szerveren](server-side.md)).

Amit a `fromMarkdown` beolvas:

- címsorok (setext alakban is: `===`-vel vagy `---`-val aláhúzott sor, és záró `#`-ekkel), felsorolás-, számozott (a kezdőszámukkal) és teendő-elemek, idézetek (a beágyazottak egy szinttel mélyebben), kerített kód (backtick vagy tilde, tetszőleges hosszal, legalább ugyanilyen hosszú kerítés zárja) és behúzott kód, elválasztók és a fenti inline jelölések;
- a listák egymásba ágyazását az elemek jelölői szerint: az a sor, amely beljebb kezdődik egy elem jelölőjénél, az elemen belül van (így a `1. ` elemek alá két, három vagy négy szóközzel is lehet ágyazni);
- egy bekezdés, listaelem vagy idézet sorait egy blokként, köztük sortöréssel; üres sor, idézetben a magában álló `>` új blokkot kezd;
- a hivatkozásos linkeket (`[text][id]` és `[id]: url`) feloldva, a lábjegyzet-definíciókat a számuk utáni bekezdésként;
- a GFM-táblázatot a `plugins` közül az első olyan plugin blokkjaként, amelyik fogad táblázatot (`fromTable`, lásd [Pluginok írása](writing-plugins.md#beillesztett-táblázatok-fogadása); a beépített `table` ilyen), különben szövegként. A szerkesztő átadja a felkínált pluginjait, így egy beillesztett táblázatból táblázat blokk lesz.

Amit a `fromHtml` beolvas – a szerkesztő ezt használja weboldalról, Google Docsból vagy Wordből érkező formázott beillesztéshez: címsorok, bekezdések, listák (beágyazva, a számozottak a kezdőszámukkal, a teendők a jelölőnégyzetekből), idézetek, kód (`pre`, `language-…` osztállyal), elválasztók, táblázatok (egy azt fogadó pluginnak) és az inline jelölések – a Google Docs félkövér, dőlt és áthúzott spanjei is. A képekből link lesz (a csomagban nincs képfogalom), a scriptek, stílusok és űrlapelemek kimaradnak. A HTML-t csak olvassa: markdownon és ugyanazon a biztonságos megjelenítésen megy át, mint minden más.

Amit a `toMarkdown` kiír:

- az egymást követő listaelemeket egymást követő sorokba, az egymást követő idézeteket egyetlen idézetként (bekezdéseik között `>`), minden más blokkot üres sorral elválasztva;
- a beágyazott elemeket, valamint egy elem alatti bekezdéseket és kódot az elem tartalmáig behúzva (`- ` alatt két, `1. ` alatt három, `10. ` alatt négy szóközzel);
- a kódot minden benne lévő backtick-sorozatnál hosszabb kerítésben, az egyszerű szöveget pedig ott escape-elve, ahol a markdown jelölésnek olvasná (`\_`, sor elején `1\.`…);
- a plugin-blokkot a pluginja `markdown(props, { inner })` függvényével, ahol az `inner` a már átalakított beágyazott blokkjai; a markdown alak nélküli plugin, illetve az, amelyik `''`-t ad vissza, kimarad.

Saját pluginod markdown alakjának megírásáról a [Pluginok írása](writing-plugins.md#markdown-alak) fejezet szól.
