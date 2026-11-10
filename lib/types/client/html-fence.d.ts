/**
 * ```dsh-html fences: the model's own HTML/CSS (and, when enabled, scripts)
 * drawn inline in the reply (fork: forever-lwy).
 *
 * The frame is borderless and transparent, as wide as the text column and as
 * tall as its content (up to the configured maximum, then it scrolls inside),
 * so prose before and after reads as one flow — no card around it. While the
 * reply streams, a one-line placeholder stands in for the growing code block;
 * the frame is built once the fence settles.
 *
 * See html-frame.ts for the sandbox and CSP. Here: the parent half — size and
 * theme messages, the user-gesture gate on `dsh.action`, and a guard that
 * restores the content when the frame navigates itself away.
 * @module @forever-lwy/dsh-genui/client/html-fence
 */
import { type Key } from 'react';
/** What the answer exporter needs from a mounted frame. */
export interface HtmlFrameRecord {
    raw: string;
    scripts: boolean;
    remote: boolean;
    height: number;
}
/** The source behind a `[data-genui-html]` element, for the answer exporter. */
export declare function htmlFrameRecordOf(element: Element): HtmlFrameRecord | undefined;
export declare function renderHtmlFence(raw: string, key: Key, settled: boolean): import("react").JSX.Element;
