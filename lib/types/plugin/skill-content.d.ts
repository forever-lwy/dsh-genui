/**
 * Settings-dependent passages of SKILL.md (fork: forever-lwy).
 *
 * SKILL.md stays one file; passages that only hold under some settings are
 * fenced with HTML comments, which a skill reader never sees rendered:
 *
 *     <!-- genui:if validation=always|uncertain -->
 *     ...text...
 *     <!-- genui:end -->
 *
 * Keys: `validation` (always / uncertain / skip), `html` (on / off),
 * `scripts` (on / off, meaningful only with html on). Blocks may nest; the
 * innermost ones resolve first.
 * @module @forever-lwy/dsh-genui/plugin/skill-content
 */
import type { GenuiConfig } from '../shared/genui-config.ts';
/**
 * Keep the blocks whose condition matches the settings and drop the rest.
 * An unknown key keeps its block (a typo must not silently delete guidance).
 */
export declare function adaptSkillContent(content: string, config: GenuiConfig): string;
