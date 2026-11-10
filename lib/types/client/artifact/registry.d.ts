/**
 * Mounted GenUI blocks by element (fork: forever-lwy): the whole-answer
 * exporter walks the reply's DOM and asks each block for its artifact
 * (spec + current interaction state) instead of re-parsing fence text.
 * @module @forever-lwy/dsh-genui/client/artifact/registry
 */
import type { GenuiArtifactV1 } from './types.ts';
export declare function registerExportableBlock(element: Element, getArtifact: () => GenuiArtifactV1): () => void;
export declare function exportableBlockOf(element: Element): (() => GenuiArtifactV1) | undefined;
