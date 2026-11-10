/**
 * The always-present system-prompt section, built from the live settings
 * (fork: forever-lwy).
 *
 * Fork changes against upstream 0.16.0:
 * - Markdown first. Upstream's "would the reader struggle without it" test
 *   still let long prose (meeting notes, summaries, reports) turn into
 *   card/list/callout stacks, because length and "key points" read as
 *   structure. The section now says plainly that prose answers, however long,
 *   stay Markdown, and lists the few cases a component earns its place.
 * - Validation wording follows `validation` (always / uncertain / skip).
 * - Root `theme` + per-node `style`, and the sandboxed ```dsh-html fence for
 *   drawings the built-in vocabulary cannot express.
 * @module @forever-lwy/dsh-genui/plugin/prompt
 */
import type { GenuiConfig } from '../shared/genui-config.ts';
export declare const RENDER_UI_TOOL_GUIDANCE = "- Tool channel: render_ui \u5DE5\u5177\u628A\u540C\u4E00 spec \u6E32\u67D3\u4E3A\u5DE5\u5177\u884C\u5361\u7247\uFF1B\u56F4\u680F\u7528\u4E8E\u56DE\u7B54\u5185\u8054 UI\u3002";
/**
 * Build the `genui:fence` section text for the given settings.
 * @param config - resolved settings; defaults reproduce {@link GENUI_SECTION_TEXT}.
 */
export declare function buildGenuiSectionText(config?: GenuiConfig): string;
/** The section text with default settings (kept as a named export for callers and tests). */
export declare const GENUI_SECTION_TEXT: string;
