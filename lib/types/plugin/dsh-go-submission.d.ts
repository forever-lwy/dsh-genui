import type { GenuiSpec } from '../client/spec.ts';
import type { NativeState } from './dsh-go-types.ts';
/** One submission snapshot shared by native rendering and dispatch. */
export declare function nativeSubmission(spec: GenuiSpec, state: NativeState, groups?: string[]): {
    registry: import("../client/submission-registry.ts").SubmissionRegistry;
    resolved: import("../client/submission-registry.ts").ResolvedSubmitState;
    answers: Record<string, string>;
    fields: Record<string, string>;
    collectedAnswers: {
        [x: string]: string | string[];
    };
};
