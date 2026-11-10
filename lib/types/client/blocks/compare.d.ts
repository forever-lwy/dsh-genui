/**
 * `compare` node: two images shown as an ordered pair (what changed, what was
 * chosen). Three layouts share one frame geometry:
 *
 * - `side`   two columns while the container allows it, one below ~560px
 *            (container query, not a window breakpoint — the same block can
 *            live in a 1100px reply column or a 320px side panel).
 * - `stack`  always vertical, for tall screenshots.
 * - `slider` one frame, the `after` image clipped at a draggable divider.
 *
 * The zoom dialog is a native <dialog> kept inside the block subtree so it
 * inherits the host theme tokens (same approach as image-group).
 * @module @changfenhuang/dsh-genui/client/blocks/compare
 */
import { type ReactNode } from 'react';
import type { GenuiCompare } from '../spec.ts';
export declare function CompareNode({ node }: {
    node: GenuiCompare;
}): ReactNode;
/** Exported for the gallery/tests: the frame height clamp. */
export declare const COMPARE_HEIGHT_CLAMP: readonly [number, number];
