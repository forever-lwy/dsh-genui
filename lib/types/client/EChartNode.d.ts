import type { GenuiEChart } from './spec.ts';
/**
 * Categorical fallback palette. The host defines its `--dsw-static-*` tokens on
 * `body`, not on `:root`, and ECharts renders to CANVAS (so a `var(--x)` string
 * is meaningless to it — every colour must be resolved to a literal first).
 * Reading only `document.documentElement` therefore returned '' for every
 * series colour and collapsed multi-series charts to one accent hue; these
 * fixed hues keep series distinguishable on any host.
 */
export declare const SERIES_FALLBACK: readonly ["#679efe", "#4ed17e", "#f5b83d", "#f2707a", "#8b7ff0", "#3fc7d4", "#b7c8fe", "#9aa3b2"];
/** 根据预设和数据生成完整的 ECharts option，并从图表容器读取宿主主题颜色。 */
export declare function presetOption(node: GenuiEChart, el?: HTMLElement | null): Record<string, unknown>;
export declare function EChartNode({ node }: {
    node: GenuiEChart;
}): import("react").JSX.Element;
