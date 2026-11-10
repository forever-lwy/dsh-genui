/**
 * GenUI plugin: teaches the model the ```dsh-ui fence syntax for emitting
 * declarative UI components inline in its reply. The browser half renders the
 * fence through GenuiBlock (ui-primitives); this host half only tells the
 * model the language exists, so a session without the plugin simply never
 * emits fences and nothing changes.
 *
 * The section uses the host's centrally allocated structured-output placement.
 * @module @changfenhuang/dsh-genui
 */
import { Context } from '@deepseek-ai/cordis';
export { GENUI_SECTION_TEXT, buildGenuiSectionText } from './prompt.ts';
export { Config } from './config.ts';
export type { GenuiConfig } from './config.ts';
/**
 * Register the GenUI output-language section and the render_ui tool.
 * @param ctx - cordis context.
 */
export declare const name = "@changfenhuang/dsh-genui";
export declare const inject: string[];
export declare function apply(ctx: Context, input?: unknown): void;
