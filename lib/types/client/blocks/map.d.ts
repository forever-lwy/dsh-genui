import type { GenuiMap } from '../spec.ts';
import type { AnswersState } from './state.ts';
export declare function MapNode({ node: raw, answers }: {
    node: GenuiMap;
    answers?: AnswersState | undefined;
}): import("react").JSX.Element;
