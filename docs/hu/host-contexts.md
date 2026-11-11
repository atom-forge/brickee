# Az alkalmazás kontextusai

[← Előző](writing-plugins.md) · [Tartalom](index.md) · [Következő →](server-side.md)

A szerkesztőnek nincsenek propjai az alkalmazás fogalmaihoz. Két dolog, amelyet maga a szerkesztő használ, Svelte-kontextuson keresztül érkezik az alkalmazástól: a kiemelhető kódnyelvek és a nyelve. Mindegyikhez tartozik egy `provide…` függvény, amelyet a szerkesztő vagy az előnézet fölötti komponens inicializálásakor hívsz meg, és egy `use…` függvény a plugin-komponensek számára.

| Kontextus | Megadás | Olvasás | Mit hordoz |
|---|---|---|---|
| Kódnyelvek | `provideCodeLanguages(() => list)` | `useCodeLanguages()` | A nyelvek, amelyeket a kódblokk felkínál. |
| Szöveg | `messages` prop, vagy `provideText(() => messages)` | `useText()` | Felületi szövegek az alkalmazás nyelvén. |

A beágyazott szerkesztők és előnézetek mindkettőt a szülőjüktől öröklik.

Minden más, amit az alkalmazás tud — az éppen mutatott képernyőszélesség, a médiatára, az aktuális felhasználó —, nem a szerkesztő dolga. A plugin az alkalmazás saját kódja: az ilyeneket az alkalmazás saját moduljaiból, store-jaiból vagy kontextusaiból olvassa (a szerkesztő és az előnézet fölött megadva), a saját vezérlőit pedig a nézetében vagy a saját mezőűrlapjában mutatja (lásd [Saját mezőűrlap](writing-plugins.md#saját-mezőűrlap)).

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
	'A link as a button': 'Egy link gombként'
};
```

Amit a szerkesztő magától lefordít:

- a beépített blokkok és a pluginok `label`, `hint` és `keys` értékeit (a perjeles menü az angol és a lefordított szavak között is keres);
- egy plugin `tag`-jének részeit, ` · `-nál darabolva;
- a mezők címkéit, helyőrzőit, az opciók címkéit és a `none` címkéket;
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
