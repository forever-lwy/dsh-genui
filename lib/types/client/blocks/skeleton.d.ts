import type { SkeletonShape } from '../streaming-shape.ts';
/** Replace a half-written spec with a placeholder of the same shape. */
export declare function GenuiSkeleton({ shape, title, columns, chartKind, lines }: {
    shape: SkeletonShape;
    title?: string;
    columns?: number;
    chartKind?: string;
    lines?: number;
}): import("react").JSX.Element;
/** Placeholder body per shape: it should read as "a table is arriving", not as
 *  "something is loading". Widths are fixed so nothing reflows on swap. */
export declare function SkeletonBody({ shape, columns, chartKind, lines }: {
    shape: SkeletonShape;
    columns?: number;
    chartKind?: string;
    lines?: number;
}): import("react").JSX.Element;
