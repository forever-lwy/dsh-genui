import type { GenuiDatePicker } from '../spec.ts';
import type { AnswersState } from './state.ts';
/** 渲染使用共享字段的单日期或日期范围控件。 */
export declare function DatePickerNode({ node, answers }: {
    node: GenuiDatePicker;
    answers?: AnswersState | undefined;
}): import("react").JSX.Element;
