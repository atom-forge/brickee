// Server-side validation of a stored document (zod). Only the shape is checked: the renderers escape every text,
// keep links to http(s)/mailto/tel/site paths, take colours only as #hex and images only from the host's media.
import { z } from 'zod';
import { acceptsId, MAX_DEPTH, MAX_INDENT, type StoredBlock } from './model';

const block: z.ZodType<StoredBlock> = z.lazy(() =>
	z.strictObject({
		type: z.string().regex(/^[a-z][a-z0-9:-]{0,39}$/),
		indent: z.number().int().min(0).max(MAX_INDENT),
		text: z.string().max(100_000).optional(),
		props: z.record(z.string().max(60), z.json()).optional(),
		blocks: z.array(block).max(500).optional()
	})
);

const depth = (blocks: StoredBlock[]): number => Math.max(0, ...blocks.map((b) => (b.blocks ? 1 + depth(b.blocks) : 0)));

export const blocksSchema = z
	.array(block)
	.max(2000)
	.refine((blocks) => depth(blocks) <= MAX_DEPTH - 1, 'Blocks may hold blocks one level deep only.')
	.refine((blocks) => JSON.stringify(blocks).length <= 1_000_000, 'The content is too large.');

/**
 * The stored blocks, also checked against the containers' `accepts` (pass the editor's plugins, or just their
 * `type` and `accepts`): a container may hold only the blocks it takes.
 */
export const blocksSchemaFor = (plugins: readonly { type: string; accepts?: readonly string[] }[]) => {
	const accepts = new Map(plugins.map((p) => [p.type, p.accepts]));
	return blocksSchema.refine(
		(blocks) => blocks.every((b) => !b.blocks || b.blocks.every((inner) => acceptsId(accepts.get(b.type), inner.type))),
		'A block holds a block it does not take.'
	);
};
