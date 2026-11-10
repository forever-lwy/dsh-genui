/**
 * Plugin settings shared by both halves (fork: forever-lwy): types, defaults
 * and the resolver. The schemastery schema lives in `plugin/config.ts` so the
 * browser bundle never pulls a schema library in.
 * @module @forever-lwy/dsh-genui/shared/genui-config
 */
/** How the prompt asks the model to use `validate_dsh_ui` before a fence. */
export type GenuiValidationMode = 'always' | 'uncertain' | 'skip';
export interface GenuiHtmlConfig {
    /** Teach and render ```dsh-html fences (sandboxed iframe, inline). */
    enabled: boolean;
    /** Allow the fence's own `<script>`s. Off = static HTML/CSS/SVG only. */
    scripts: boolean;
    /** Allow https: images, fonts, styles and scripts (e.g. a CDN library). */
    remote: boolean;
    /** Upper bound of the auto-sized frame height in px; taller content scrolls inside. */
    maxHeight: number;
}
export interface GenuiConfig {
    validation: GenuiValidationMode;
    /** Same-turn correction request when a final fence cannot render. */
    fenceFeedback: boolean;
    /** Register the `render_ui` tool (renders as a separate tool card). */
    renderUiTool: boolean;
    html: GenuiHtmlConfig;
    /** Show the "export this answer" button under finalized assistant messages. */
    exportAnswer: boolean;
}
export declare const DEFAULT_GENUI_CONFIG: GenuiConfig;
/**
 * Resolve the row's config (volatile references or plain values, possibly
 * partial or absent) into a complete, detached settings object.
 */
export declare function snapshotGenuiConfig(raw: unknown): GenuiConfig;
