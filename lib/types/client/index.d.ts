/**
 * dsh-genui browser half: the ```dsh-ui fence renderer, the keyed toolview
 * for the `render_ui` tool, and the session panel dock.
 *
 * Fence rendering uses DSH's language-keyed Markdown fence layers. The host
 * owns discovery, streaming and React lifetime; GenUI owns its render tree and
 * session-scoped actions.
 *
 * The renderer parses the fence body with the partial parser: while the reply
 * streams, every FINISHED component appears the moment its JSON object
 * closes, so the UI assembles top-down before the fence (or reply) completes.
 * A body with no finished component yet falls back to a plain code block.
 * @module @changfenhuang/dsh-genui/client
 */
import type { Context } from '@deepseek-ai/cordis';
/** Add low-priority prefetch links for the lazy engine assets (mermaid/three).
 * Browser-dependent: some engines ignore `<link rel=prefetch>`; harmless
 * either way — the on-demand loader still covers a cache miss. Exported for
 * tests.
 *
 * Not called at boot: these engines are ~1.25 MB gzip together, and most
 * sessions never render a mermaid or 3D node. {@link prefetchOnFirstFence}
 * arms it once, when the first `dsh-ui` fence actually renders. */
export declare function prefetchGenuiAssets(): void;
/** DOM fence renderer 挂载 dsh-ui fence 后派发的事件。 */
export declare const FENCE_MOUNTED_EVENT = "genui:fence-mounted";
/**
 * Prefetch the lazy engines once, after the first `dsh-ui` fence renders.
 * @returns a disposer removing the pending listener.
 */
export declare function prefetchOnFirstFence(): () => void;
/** Cordis client entry: install the fence renderer on boot, the keyed
 * toolview for the render_ui tool, and the session panel dock; returning the
 * disposers lets cordis tear all registrations down on plugin unload. */
export declare function apply(ctx: Context): () => void;
export type { SidechatSurface, SidechatSurfaceService } from './sidechat-surface.tsx';
export declare const inject: string[];
/** Trusted host configuration, separate from model-authored JSON. */
export { GenuiMapContext, setGenuiMapConfig } from './map-config.ts';
export type { GenuiMapConfig, GenuiMapStyle } from './map-config.ts';
