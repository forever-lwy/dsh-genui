/**
 * `choices` node: a decision the reader has to MAKE. Each row carries its own
 * cost, so the trade-off is visible at the point of choosing instead of being
 * reconstructed from a paragraph.
 *
 * Local-first: selection is local state, `action` is optional. Submitting an
 * option is not the same as the work being done — the footer therefore says
 * "已提交" and keeps the rows editable instead of pretending completion.
 * @module @changfenhuang/dsh-genui/client/blocks/choices
 */
import { type ReactNode } from 'react';
import type { GenuiChoices } from '../spec.ts';
import type { AnswersState } from './state.ts';
export declare function ChoicesNode({ node, onAction, answers }: {
    node: GenuiChoices;
    onAction?: ((action: string, payload: Record<string, unknown>) => void) | undefined;
    answers?: AnswersState | undefined;
}): ReactNode;
