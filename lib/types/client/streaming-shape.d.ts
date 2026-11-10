/**
 * Shape-aware streaming skeleton.
 *
 * While a fence body is still arriving and nothing has parsed yet, the block is
 * replaced by a placeholder. A generic three-bar placeholder communicates
 * "loading" but nothing about WHAT is loading, and it appears often enough to
 * feel like a different product from the component that replaces it. This module
 * reads what is already known from the partial body — the first component `type`
 * and the `title`, if it has arrived — so the placeholder can look like the thing
 * it is about to become.
 *
 * The inference is deliberately shallow: one regex each, no incremental parser.
 * Anything uncertain falls back to the generic shape, because a wrong guess is
 * worse than a neutral one.
 *
 * @module streaming-shape
 */
/** Placeholder layouts, one per component family that looks different enough. */
export type SkeletonShape = 'card' | 'table' | 'chart' | 'list' | 'keyvalue' | 'stat' | 'text' | 'diagram' | 'code' | 'media' | 'control' | 'rule' | 'generic';
/** What the prefix already tells us about the component's SIZE. */
export interface SkeletonDetail {
    /** Table: how many columns were declared (3 when unknown). */
    columns?: number;
    /** Chart: the declared kind, which decides bars vs a donut ring. */
    chartKind?: string;
    /** Text/callout: an estimate of the rendered line count. */
    lines?: number;
}
/** Infer the placeholder shape, its known title, and its size hints. */
export declare function inferSkeleton(raw: string): {
    shape: SkeletonShape;
    title?: string;
    columns?: number;
    chartKind?: string;
    lines?: number;
};
