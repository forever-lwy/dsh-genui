import type { GenuiSegmentedControl } from '../spec.ts';
import type { GenuiBlockProps, AnswersState } from './state.ts';
/** 渲染可通过选中值更新同级组件的单选控件。 */
export declare function SegmentedControlNode({ node, onAction, answers }: {
    node: GenuiSegmentedControl;
    onAction?: GenuiBlockProps['onAction'];
    answers?: AnswersState | undefined;
}): import("react").JSX.Element;
