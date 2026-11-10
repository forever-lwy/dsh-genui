/**
 * Root `theme` and per-node `style` (fork: forever-lwy).
 *
 * Both only ever become CSS custom properties and inline style declarations
 * set through React's style object, never a stylesheet string, so a value
 * cannot open a new rule. Values are still filtered: anything that could
 * fetch (`url(`, `image-set(`), run (`expression`, `javascript:`), or break
 * out of a declaration (`;`, braces, angle brackets, backslash, `@`) is
 * dropped, and every value is length-capped.
 * @module @forever-lwy/dsh-genui/client/theme
 */
import type { CSSProperties } from 'react';
export declare const THEME_RADII: readonly ["none", "sm", "md", "lg", "xl"];
export declare const THEME_DENSITIES: readonly ["compact", "normal", "relaxed"];
export declare const THEME_FONTS: readonly ["sans", "serif", "mono", "rounded"];
export declare const THEME_SURFACES: readonly ["default", "flat", "outline", "soft", "glass", "elevated"];
export declare const THEME_SHADOWS: readonly ["none", "soft", "strong"];
export interface GenuiTheme {
    accent?: string;
    radius?: typeof THEME_RADII[number] | number;
    density?: typeof THEME_DENSITIES[number];
    /** A preset name or a font-family list. */
    font?: string;
    surface?: typeof THEME_SURFACES[number];
    /** Colour or gradient painted behind the whole block. */
    background?: string;
    text?: string;
    muted?: string;
    border?: string;
    /** Default categorical palette for chart / echart nodes without their own. */
    palette?: string[];
    shadow?: typeof THEME_SHADOWS[number];
}
/** Style keys a node may carry, mapped to whether a bare number means px. */
declare const STYLE_KEYS: {
    readonly background: false;
    readonly backgroundColor: false;
    readonly color: false;
    readonly border: false;
    readonly borderColor: false;
    readonly borderWidth: true;
    readonly borderStyle: false;
    readonly borderRadius: true;
    readonly padding: true;
    readonly margin: true;
    readonly gap: true;
    readonly fontSize: true;
    readonly fontWeight: false;
    readonly fontFamily: false;
    readonly fontStyle: false;
    readonly lineHeight: false;
    readonly letterSpacing: true;
    readonly textAlign: false;
    readonly textTransform: false;
    readonly textShadow: false;
    readonly boxShadow: false;
    readonly opacity: false;
    readonly width: true;
    readonly maxWidth: true;
    readonly minHeight: true;
    readonly backdropFilter: false;
    readonly filter: false;
    readonly transform: false;
};
export type GenuiStyleKey = keyof typeof STYLE_KEYS;
export type GenuiNodeStyle = Partial<Record<GenuiStyleKey, string | number>>;
/** A CSS value the model may set, or undefined when it is unsafe or malformed. */
export declare function safeCssValue(value: unknown, pxNumbers?: boolean): string | undefined;
/** Repair a node's `style`; unknown keys and unsafe values are dropped. */
export declare function repairNodeStyle(value: unknown): GenuiNodeStyle | undefined;
/** Repair a root `theme`; malformed fields are dropped one by one. */
export declare function repairTheme(value: unknown): GenuiTheme | undefined;
/** Relative luminance (0–1) of the first hex or rgb() colour in a CSS value. */
export declare function cssLuminance(value: string | undefined): number | undefined;
type StyleWithVars = CSSProperties & Record<`--${string}`, string>;
/**
 * The block root's inline style and `data-genui-surface` for a theme.
 * Custom properties set inline on `.block` win over the class's own token
 * declarations (same element, higher priority), so every component inherits.
 */
export declare function themeRootProps(theme: GenuiTheme | undefined): {
    style?: StyleWithVars;
    surface?: string;
};
/** Inline style for a node's `style` field (already repaired). */
export declare function nodeInlineStyle(style: GenuiNodeStyle | undefined): CSSProperties | undefined;
/**
 * Give every chart/echart without its own `palette` the theme's palette.
 * Returns the input unchanged when there is nothing to apply; otherwise a
 * copy (the caller's spec is memoized and must stay untouched).
 */
export declare function applyThemePalette<T extends {
    theme?: GenuiTheme;
    items: unknown[];
}>(spec: T): T;
export {};
