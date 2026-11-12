# Mikro popupok: z-index (2026-11-11)

## A hiba

A szerkesztő kis lebegő elemei nem jelentek meg, mert z-index miatt egy ablak (modal) mögé kerültek: a szerkesztő
egy `@atom-forge/ui` ablakban volt, a menük pedig alatta rajzolódtak ki.

Érintett elemek (mindkettő `use:portal`-lal a `<body>` végére kerül, saját, rögzített z-indexszel):

- `src/lib/editor/FormatBar.svelte`: a kijelölés fölötti formázósáv, `fixed z-20`.
- `src/lib/editor/BlockMenu.svelte`: a perjeles (slash) és az „Átalakítás” menü, `fixed z-30`.

Ami jól működik: a linkmező (`LinkPrompt`) és a szövegközi elemek űrlapja (`InlineEdit`) már a popup-kezelőn át
nyílik (`popups.open.component(…)`, `Editor.svelte`), és ezek helyesen az ablak fölé rétegződnek. A szerkesztő
popup-kezelője: `nested ? getPopupManager() : createPopupManager(getPopupManager())`, a `PopupContainer` pedig
portállal a `<body>`-ba kerül.

## Javasolt megoldás

Az `@atom-forge/ui` popup-rétegébe tenni őket. A gamer365 képválasztója is így működik. Ha a FormatBar és a BlockMenu
is ebbe a rétegbe kerül a `<body>` helyett, a z-index kérdése megszűnik, mert a réteget az a könyvtár kezeli, amelyik
az ablakokat is.

Megnézendő a megvalósításkor:

- [x] Az `@atom-forge/ui` popup-kezelője tud-e nem modális, fókuszt el nem vevő, a kurzorhoz (kijelöléshez) igazított
      réteget adni. A formázósávnak és a slash menünek a szerkesztőben kell hagynia a fókuszt és a kijelölést, a
      gépelés közben frissülnie kell (szűrés, pozíció). **Eredmény: részben; erre a két menüre nem való** (lásd lent).
- [x] Ha nem tud, a rétegét (konténerét) kérjük el, és abba portálozunk, ne a `<body>`-ba. **Eredmény: van ilyen
      konténer, `#atom-forge-portal-target`; ez a javasolt út** (lásd lent).
- [ ] A kívül kattintásra záródás, az Escape és a görgetéskori igazítás maradjon ugyanaz. (Az Escape-nél egy már
      meglévő hibát is javítani kell, lásd lent.)
- [ ] Próba: szerkesztő egy ui-ablakban (modal), formázósáv, slash menü, Átalakítás menü, sötét mód; a képernyőképek
      (`scripts/shots.mjs`) ne változzanak.

## Az ellenőrzés eredménye (2026-11-12, `@atom-forge/ui` 0.0.39 forrása)

### Miért kerülnek az ablak mögé

- Az ui ablakai (modal, drawer) `fixed` rétegek `z-index: 9000 + 20 × sorszám` értékkel
  (`overlayZIndex`, `controls/overlays/shared/overlay-manager.svelte.ts`).
- A popupok `fixed z-10000` rétegben vannak (`Popup.svelte`), ezért látszik a link- és az inline-űrlap az ablak fölött.
- A FormatBar (`z-20`) és a BlockMenu (`z-30`) a `<body>` végén 9000 alatt van, ezért az ablak mögé kerül.

### Mit tud a popup-kezelő (`PopupManager`)

- **Fókusz és kijelölés:** jó. A `Popup` nem veszi el a fókuszt, és nem fogja meg; a kattintásnak csak a továbbterjedését
  állítja le. A kijelölés megtartása (`onmousedown` + `preventDefault`) a komponensen múlik, mint most.
- **Frissítés gépelés közben:** a tartalomnál megoldható, a helyzetnél nem igazán.
  - A `params`-ot nyitáskor kapja. Ha `$state` objektumot vagy getter függvényt adunk át, a szűrés és a kiemelt sor
    frissül.
  - A helyzetet `pos`-szal nyitáskor egyszer számolja ki. `anchor`-ral képkockánként követi, de csak egy DOM-elemet,
    kijelölés-téglalapot nem.
  - Mindig a képernyőnegyed szerint teszi a horgony alá vagy fölé, oldalra igazítva. A formázósáv viszont a kijelölés
    fölé, középre kerül; ezt a kezelő nem tudja.
- **Egy kezelő egyszerre egy popupot tart.** Ha egy már nyitott helyett újat nyitunk, az új 200 ms késéssel jelenik meg.
  A formázósáv minden kijelölés-változáskor újranyílna, ez villogást és késést okozna. A linkmező ugyanabban a kezelőben
  bezárná a sávot.
- **Bármely kattintásra záródik az ablakban** (`<svelte:window onclick>`), és ígéretet (promise) old fel. Ez a
  „kérdezz, válaszolj” űrlapokhoz (link, inline elem) való, nem a gépelés közben élő menükhöz.
- **Escape-kezelése nincs.**

Következtetés: a FormatBar és a BlockMenu áttétele a popup-kezelőbe több új bajt hozna (villogás, késés, rossz helyzet,
záródás a szövegbe kattintáskor), mint amennyit megold. A link- és az inline-űrlap maradjon a kezelőben, ahogy most van.

### A javasolt út: az ui portál-célja

Az ui `Root` komponense ad egy konténert a lebegő elemeknek: `<div id="atom-forge-portal-target" class="relative
z-10000">` (`core/Root.svelte`). Az ui saját `Tooltip`-je is ebbe portálozik (`use:portal={"#atom-forge-portal-target"}`).

- A Brickee `portal` akciója (`src/lib/dom.ts`) ezt a célt használja, ha van, egyébként a `<body>`-t.
- Így a menük az ablakok (9000…) fölött vannak, a popupok (`z-10000`, a DOM-ban később) pedig a menük fölött: a
  formázósávból nyitott linkmező a sáv fölé kerül.
- A réteget az ui kezeli, a Brickee saját z-indexe (`z-20`/`z-30`) csak a konténeren belüli sorrendet adja.
- A helyzet, a frissítés, a záródás és a fókusz minden más része változatlan marad.
- `Root` nélkül (nincs portál-cél) a mostani viselkedés marad.
- Megnézendő: a cél `relative`, és egy `display: contents` testvér után áll. A benne lévő `fixed` menük a nézőablakhoz
  igazodnak, de csak akkor, ha egyik őse sem `transform`-os. A `Root`-ban egyik sem az, de próbán ellenőrizni kell.

### Közben talált hiba: az Escape az ablakot is bezárja

Az ui ablakkezelője a `window`-on figyeli az Escape-et, és a legfelső ablakot akkor is bezárja, ha az eseményt már
lekezelték: nem nézi a `defaultPrevented`-et (`SharedOverlayContainer.svelte`, `handleKeydown`).

A Brickee az Escape-nél csak `preventDefault()`-ot hív, `stopPropagation()`-t nem:

- a slash és az Átalakítás menü bezárásánál, a blokk-kijelölésnél (`Editor.svelte`);
- az `InlineEdit`-ben.

Ezért ablakban a slash menü Escape-pel bezárásakor az ablak is bezárul. Két javítás lehetséges, a kettő együtt a
legjobb:

- [ ] Brickee: ahol az Escape-et a szerkesztő kezeli, `stopPropagation()` is.
- [ ] ui: a `handleKeydown` hagyja békén a `defaultPrevented` eseményt.
