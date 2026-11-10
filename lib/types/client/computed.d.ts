import type { GenuiComputed, GenuiSpec } from './spec.ts';
/** 判断规格字段是否用于展示可插值的文字。 */
export declare function isComputedTemplateField(type: unknown, key: string): boolean;
export type ComputedTemplateScope = boolean | 'blocks-row' | 'blocks-cell';
export type ComputedNodeScope = boolean | 'nested-items';
/** 只有组件容器的子节点字段允许再次识别组件；原始数据中的 type 没有组件含义。 */
export declare function getComputedChildNodeScope(type: unknown, key: string, parentScope: ComputedNodeScope): ComputedNodeScope;
/** 为嵌套展示数据选择模板范围，并在组件边界重置继承范围。 */
export declare function getComputedTemplateScope(type: unknown, key: string, parentScope: ComputedTemplateScope): ComputedTemplateScope;
export interface ComputedEvaluation {
    values: Record<string, number>;
    formatted: Record<string, string>;
    errors: Record<string, string>;
}
export interface ComputedGraph {
    order: GenuiComputed[];
    errors: Record<string, string>;
}
/**
 * 收集可供 Computed 表达式读取的非密码字段 ID。
 *
 * @param spec - 已修复的 GenUI 规格。
 * @returns 符合表达式名称规则的字段 ID 集合。
 */
export declare function getComputedInputIds(spec: GenuiSpec): Set<string>;
/** 收集重复声明的数值输入字段 ID。 */
export declare function getDuplicateComputedInputIds(spec: GenuiSpec): string[];
/**
 * 检查计算定义并按字段依赖关系生成执行顺序。
 *
 * @param definitions - 规格声明的计算字段。
 * @param inputIds - 可读取的输入字段 ID。
 * @param duplicateInputIds - 重复声明的输入字段 ID。
 * @returns 有序计算定义及对应错误。
 */
export declare function buildComputedGraph(definitions: readonly GenuiComputed[], inputIds: ReadonlySet<string>, duplicateInputIds?: ReadonlySet<string>, allowExternalReferences?: boolean): ComputedGraph;
/**
 * 读取输入字段并计算所有可用的 Computed 值。
 *
 * @param spec - 已修复的 GenUI 规格。
 * @param fields - 当前交互状态中的字段值。
 * @returns 数值结果、格式化结果和计算错误。
 */
export declare function evaluateComputed(spec: GenuiSpec, fields: Readonly<Record<string, string>>): ComputedEvaluation;
/**
 * 将模板引用和数值引用解析到待渲染组件树中。
 *
 * @param spec - 原始已修复规格。
 * @param result - 当前字段状态对应的计算结果。
 * @returns 已替换引用的规格副本。
 */
export declare function resolveComputedSpec(spec: GenuiSpec, result: ComputedEvaluation): GenuiSpec;
