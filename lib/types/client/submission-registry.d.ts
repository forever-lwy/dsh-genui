import type { GenuiSpec } from './spec.ts';
export type SubmissionMember = RadioSubmissionMember | CheckboxSubmissionMember | FieldSubmissionMember;
export interface RadioSubmissionMember {
    kind: 'radio';
    key: string;
    label: string;
    options: string[];
    answer?: number | string;
    explanation?: string;
}
export interface CheckboxSubmissionMember {
    kind: 'checkbox';
    key: string;
    /** 来源文案模板 → 当前显示文案。 */
    choices: Map<string, string>;
}
export interface FieldSubmissionMember {
    kind: 'field';
    key: string;
    fieldType: 'input' | 'editor' | 'textarea' | 'select' | 'slider' | 'map' | 'diagram' | 'date-picker' | 'segmented-control';
    secret: boolean;
    datePicker?: {
        mode: 'single' | 'range';
        min?: string;
        max?: string;
    };
}
export interface SubmissionRegistry {
    members: ReadonlyMap<string, SubmissionMember>;
}
export interface SubmitInteractionState {
    answers: Record<string, string>;
    multiAnswers: Record<string, string[]>;
    fields: Record<string, string>;
    secretFields: ReadonlySet<string>;
    /** Field ids / groups hidden by a `when` condition: out of scope entirely. */
    hidden?: ReadonlySet<string>;
}
export interface ResolvedSubmitState {
    scope: SubmissionMember[];
    answered: number;
    total: number;
    localGradeEligible: boolean;
    hasOutOfScopePayload: boolean;
}
/** 从 spec 建立成员表，并诊断 submission key 和 submit.groups。 */
export declare function analyzeSubmissionRegistry(spec: GenuiSpec, allowExternalGroups?: boolean): {
    registry: SubmissionRegistry;
    diagnostics: string[];
};
/** 编译供运行时读取的静态 submission 成员表。 */
export declare function compileSubmissionRegistry(spec: GenuiSpec): SubmissionRegistry;
/** 根据当前交互状态判断一个 submission member 是否完成。 */
export declare function isSubmissionMemberAnswered(member: SubmissionMember, state: SubmitInteractionState): boolean;
/** 计算 submit 进度和纯本地判卷条件。 */
export declare function resolveSubmitState({ registry, groups, state }: {
    registry: SubmissionRegistry;
    groups?: string[];
    state: SubmitInteractionState;
}): ResolvedSubmitState;
