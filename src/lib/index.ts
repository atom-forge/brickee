// Brickee: a Svelte 5 block editor. The core is markdown (`md:p`, `md:h2`, `md:code`…) plus the kit to write plugins
// with; every other block is a plugin with an editor view, a site preview and optionally a markdown form. The bundled
// plugins (@atom-forge/brickee/plugins) are plugins like any other. The stored form is `StoredBlock[]` (see model.ts).
export { default as Editor } from './Editor.svelte';
export { default as Preview } from './Preview.svelte';
// The kit: what plugins are written with (box frame, empty state, helpers).
export { default as Frame } from './kit/Frame.svelte';
export { default as Empty } from './kit/Empty.svelte';
export * from './kit/util';
export * from './model';
export { inline, fromStored, toStored, fromMarkdown, toMarkdown } from './markdown';
export { fromHtml } from './html';
export { provideCodeLanguages, useCodeLanguages, type CodeLanguage } from './code';
export { provideInlinePlugins, useInlinePlugins } from './inline-plugins';
export { scrollSync, scrollFraction, setScrollFraction, type ScrollSync } from './scroll';
export { provideText, useText, translator, type Messages, type Translate } from './i18n';
export { PALETTE_ITEMS, BUILT_IN_IDS, narrowPalette, type Icon, type PaletteItem } from './palette';
export type { MarkdownContext, MarkdownTable, InlinePlugin, InlineOptions, Block, BlockType, Content, PluginFormProps, PluginPreviewProps, PluginViewProps, PropField, Props, BlockPlugin } from './types';
