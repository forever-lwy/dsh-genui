import { type ReactElement } from 'react';
import type { GenuiEditor } from '../spec.ts';
import type { AnswersState } from './state.ts';
/** 纯文本编辑器，草稿保存在所属 GenUI 区块中。 */
export declare function EditorNode({ node, answers }: {
    node: GenuiEditor;
    answers?: AnswersState | undefined;
}): ReactElement;
