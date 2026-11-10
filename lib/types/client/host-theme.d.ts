/**
 * Host theme → plain CSS values for sandboxed frames (fork: forever-lwy).
 *
 * A `dsh-html` frame is a separate document: the host's `--dsw-*` tokens do
 * not cascade into it. The values are resolved here (a probe element inside
 * the reply, so scoped overrides apply) and sent as `--dsh-*` variables. One
 * shared observer watches the attributes theme switches touch on <html> and
 * <body> and notifies every frame once per frame-time when the values change.
 * @module @forever-lwy/dsh-genui/client/host-theme
 */
import type { HtmlFrameTheme } from './html-frame.ts';
/** Resolve the frame theme as seen from `anchor` (inside the reply). */
export declare function readHostTheme(anchor: Element | null): HtmlFrameTheme;
/** Call `listener` after anything that may have switched the host theme. */
export declare function onHostThemeChange(listener: () => void): () => void;
