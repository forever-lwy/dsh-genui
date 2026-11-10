import type { ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { GenuiConfig } from '../shared/genui-config.ts';
export interface DocSection {
    /** Canonical key (first name in the heading). */
    key: string;
    kind: 'component' | 'topic';
    text: string;
}
export interface DocIndex {
    sections: Map<string, DocSection>;
    components: string[];
    topics: string[];
}
/** Package root: lib/index.js → .., src/plugin/docs.ts → ../.. */
export declare function packageRoot(): string;
/** Split a reference file into `## key / alias` sections. */
export declare function parseSections(markdown: string, kind: DocSection['kind']): DocSection[];
/** Read and index the reference files once. */
export declare function loadDocIndex(root?: string): DocIndex;
/** Answer one request: the sections asked for, filtered by settings, plus what was not found. */
export declare function answerDocs(index: DocIndex, config: GenuiConfig, args: unknown): string;
/** Build the tool; the index is read lazily on the first call. */
export declare function createGenuiDocsTool(config: () => GenuiConfig, load?: () => DocIndex): ToolDefinition;
