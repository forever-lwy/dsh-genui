/**
 * Plugin settings schema (fork: forever-lwy).
 *
 * Every field is volatile: DSH 0.2.2's settings form only exposes volatile
 * fields, and the loader then updates them in place (`loader/volatile-update`)
 * instead of remounting the plugin. The host half therefore reads the
 * settings through {@link snapshotGenuiConfig} at each use; the browser half
 * reads the same row through `configForms`.
 * @module @forever-lwy/dsh-genui/plugin/config
 */
import z from '@deepseek-ai/schemastery';
import { type GenuiConfig } from '../shared/genui-config.ts';
export { DEFAULT_GENUI_CONFIG, snapshotGenuiConfig } from '../shared/genui-config.ts';
export type { GenuiConfig, GenuiHtmlConfig, GenuiValidationMode } from '../shared/genui-config.ts';
export declare const Config: z<GenuiConfig>;
