import { type ReactNode } from 'react';
import type { GenuiImage } from '../spec.ts';
/**
 * Native image display with a click-to-zoom viewer.
 *
 * The zoom dialog is a native <dialog> kept inside the block subtree so it
 * inherits the host theme tokens (the same approach image-group and compare
 * use). Source safety is enforced upstream by repairGenuiSpec/safeMediaSrc.
 *
 * @param props.node - one validated `image` node.
 * @returns the framed picture, its label/caption, and the zoom viewer.
 */
export declare function ImageNode({ node }: {
    node: GenuiImage;
}): ReactNode;
