/**
 * The recursive render dispatcher: maps the white-listed GenuiNode union to
 * concrete components. Leaf cases render inline; compound families live in
 * the sibling block modules. Depth-guarded against pathological specs.
 * @module @changfenhuang/dsh-genui/client/blocks/render-node
 */
import { type ReactNode } from 'react';
import type { GenuiNode } from '../spec.ts';
import type { AnswersState, GenuiBlockProps } from './state.ts';
/**
 * Render a node, applying its layout gate first.
 *
 * `when` hides the node; `enableWhen` keeps it on screen but inert. The inert
 * wrapper covers the whole subtree with the HTML `inert` attribute plus
 * `pointer-events: none`, so every control inside it — including ones added
 * later — stops responding without each component having to know about the
 * gate. `disabledReason` says what unlocks it; a disabled control with no
 * explanation is a dead end.
 */
export declare function renderNode(node: GenuiNode, key: number, onAction: GenuiBlockProps['onAction'] | undefined, depth?: number, answers?: AnswersState, path?: string): ReactNode;
