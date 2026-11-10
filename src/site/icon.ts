import type { IconDefinition } from '@atom-forge/ui';
import type { Component } from 'svelte';

/** @lucide/svelte icons for @atom-forge/ui: its IconDefinition type still names the legacy lucide-svelte class
 * components, while it renders Svelte 5 components just as well. */
export const uiIcon = (icon: Component<any>) => icon as unknown as IconDefinition;
