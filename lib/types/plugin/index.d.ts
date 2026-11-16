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
import type { IncomingMessage, ServerResponse } from 'node:http';
/** Strong validator for one asset: its content hash (assets are built output and fixed per release). */
export declare function assetEtag(body: Uint8Array): string;
/** Whether an `If-None-Match` header already names `etag` (comma list, `*`, or weak `W/` forms). */
export declare function etagMatches(header: string | string[] | undefined, etag: string): boolean;
/** The handler itself (registered via the optional webServer probe). */
export declare function serveGenuiAsset(req: IncomingMessage, res: ServerResponse, assetDirectory?: string): Promise<void>;
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
