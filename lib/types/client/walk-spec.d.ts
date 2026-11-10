import type { GenuiNode, GenuiSpec, GenuiWhen } from './spec.ts';
interface AncestorCondition {
    condition: GenuiWhen;
    path: string;
}
/** 遍历完整 GenUI 组件树，并提供节点路径和祖先条件来源。 */
export declare function walkGenuiNodes(spec: GenuiSpec, visitor: (node: GenuiNode, path: string, ancestorConditions: readonly AncestorCondition[]) => void): void;
export {};
