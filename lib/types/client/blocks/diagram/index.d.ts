import type { GenuiDiagram } from '../../spec.ts';
import type { AnswersState } from '../state.ts';
/** 渲染可选择的图解，并通过共享字段保存所选节点。 */
export declare function DiagramNode({ node, answers }: {
    node: GenuiDiagram;
    answers?: AnswersState | undefined;
}): import("react").JSX.Element;
