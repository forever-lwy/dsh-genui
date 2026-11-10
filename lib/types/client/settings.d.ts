import { type GenuiConfig } from '../shared/genui-config.ts';
/** The slice of `@deepseek-ai/dsh-client-ui-settings`'s ConfigForm this page uses. */
export interface GenuiConfigForm {
    getSnapshot(): {
        status: 'loading' | 'ready' | 'unavailable';
        value: unknown;
        user: unknown;
        revision: number | undefined;
        writable: boolean;
    };
    subscribe(listener: () => void): () => void;
    mutate(ops: readonly PathOp[], expectedRevision?: number): Promise<boolean>;
}
export type PathOp = {
    op: 'set';
    path: string[];
    value: unknown;
} | {
    op: 'unset';
    path: string[];
};
/** Section writes turning `current` into `next` (whole sections; `html` is one volatile object). */
export declare function settingsDiff(current: GenuiConfig, next: GenuiConfig): PathOp[];
export declare function GenuiSettings(props: {
    form: GenuiConfigForm;
    view?: 'summary' | 'page';
}): import("react").JSX.Element;
