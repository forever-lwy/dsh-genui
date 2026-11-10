/**
 * Conditional visibility for GenUI nodes.
 *
 * A node carrying `when` renders only while the condition holds. The condition
 * reads the block's own field/answer state, so a decision tree reacts instantly
 * with no model round trip:
 *
 *     { "type": "select", "id": "entity", "options": ["公司", "个人"] }
 *     { "type": "input", "id": "taxId", "label": "税号",
 *       "when": { "field": "entity", "op": "eq", "value": "公司" } }
 *
 * Two rules make this safe rather than merely visual:
 *
 * 1. A hidden node is not rendered, so the reader never sees a stale control.
 * 2. `collectHiddenKeys` lists the field ids/groups under a false condition, and
 *    the sibling `submit` filters them out of its payload and its required set.
 *    A hidden field must never submit a value the reader cannot see, and it must
 *    never block submission by looking unanswered.
 *
 * Without block state (export, panel, embedded renderer with no provider) the
 * condition cannot be evaluated: nodes stay VISIBLE. Hiding content on missing
 * state would silently drop a whole branch of an exported document.
 *
 * @module conditions
 */
import type { GenuiWhen } from './spec.ts';
/** The slice of block state a condition can read. */
export interface ConditionState {
    fields: Readonly<Record<string, string>>;
    answers: Readonly<Record<string, string>>;
    multiAnswers: Readonly<Record<string, string[]>>;
    conditionHidden?: ReadonlySet<string>;
}
/**
 * Evaluate one condition against block state.
 * @param when - the condition carried by a node.
 * @param state - current field/answer state.
 * @returns true when the node should render.
 */
export declare function evaluateWhen(when: GenuiWhen, state: ConditionState): boolean;
/**
 * Field ids and answer groups hidden by a false condition anywhere in the tree.
 * @param items - root node list.
 * @param state - current field/answer state.
 * @returns keys whose visible controls are not on screen right now.
 */
export declare function collectHiddenKeys(items: unknown, state: ConditionState): ReadonlySet<string>;
