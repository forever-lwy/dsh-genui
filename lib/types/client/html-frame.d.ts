/**
 * The document behind a ```dsh-html fence (fork: forever-lwy).
 *
 * The model's HTML runs in an `<iframe sandbox srcdoc>` WITHOUT
 * `allow-same-origin`: the frame has an opaque origin, so it cannot read the
 * DSH page, its cookies, storage or the session token, and the browser
 * treats every request it makes as cross-site. A meta CSP written before the
 * model's markup closes the network (`connect-src 'none'`, no frames, no form
 * targets) and, unless remote resources are enabled, every external fetch.
 *
 * A small bootstrap script (always allowed: it carries the nonce when the
 * model's scripts are disabled) reports the content height, receives live
 * theme variables and exposes `dsh.action(name, data)`, which the parent only
 * honours right after a user gesture.
 * @module @forever-lwy/dsh-genui/client/html-frame
 */
export interface HtmlFrameTheme {
    /** CSS custom properties (`--dsh-fg`, …) to set on the frame's :root. */
    vars: Record<string, string>;
    scheme: 'light' | 'dark';
}
export interface HtmlFrameOptions {
    /** Unique id carried by every message, so a frame only answers to its parent. */
    frameId: string;
    scripts: boolean;
    remote: boolean;
    theme: HtmlFrameTheme;
}
/** Message tag on everything the bootstrap posts and accepts. */
export declare const FRAME_MESSAGE_TAG = "__dshHtml";
/** Random token for the CSP nonce and frame ids. */
export declare function randomToken(): string;
export declare function frameCsp(options: Pick<HtmlFrameOptions, 'scripts' | 'remote'>, nonce: string): string;
/**
 * Build the frame's `srcdoc`.
 *
 * The model's markup goes inside `<body>` as is: the HTML parser folds a
 * stray `<html>`/`<head>`/`<body>` from a full document into ours, while the
 * CSP meta, base styles and bootstrap above it are already in force.
 */
export declare function buildHtmlFrameDocument(html: string, options: HtmlFrameOptions): string;
/** Sandbox flags: scripts for the bootstrap (CSP decides about the model's), popups for links. */
export declare const FRAME_SANDBOX = "allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock";
