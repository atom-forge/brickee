import type { IconDefinition } from "@atom-forge/ui";

export type MenuSeparator = { type: "separator" };
export type MenuHeading  = { type: "heading"; label: string };
export type MenuItemLeaf = {
	label: string;
	href?: string;
	icon?: IconDefinition;
	onclick?: () => void;
	active?: boolean;
	children?: MenuItem[];
	only?: 'mobile' | 'desktop';
	type?: never;
};
export type MenuItem = MenuItemLeaf | MenuSeparator | MenuHeading;
