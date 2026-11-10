import { type ReactNode } from 'react';
import type { GenuiCarousel } from '../spec.ts';
/** Local navigation only: children retain their renderer-owned state and actions. */
export declare function CarouselNode({ node, children }: {
    node: GenuiCarousel;
    children: ReactNode[];
}): ReactNode;
