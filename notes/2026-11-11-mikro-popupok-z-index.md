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

- [ ] Az `@atom-forge/ui` popup-kezelője tud-e nem modális, fókuszt el nem vevő, a kurzorhoz (kijelöléshez) igazított
      réteget adni. A formázósávnak és a slash menünek a szerkesztőben kell hagynia a fókuszt és a kijelölést, a
      gépelés közben frissülnie kell (szűrés, pozíció).
- [ ] Ha nem tud, a rétegét (konténerét) kérjük el, és abba portálozunk, ne a `<body>`-ba.
- [ ] A kívül kattintásra záródás, az Escape és a görgetéskori igazítás maradjon ugyanaz.
- [ ] Próba: szerkesztő egy ui-ablakban (modal), formázósáv, slash menü, Átalakítás menü, sötét mód; a képernyőképek
      (`scripts/shots.mjs`) ne változzanak.
