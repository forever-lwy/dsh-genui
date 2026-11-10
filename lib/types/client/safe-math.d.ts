/**
 * SafeMath 为 GenUI plot 和 Computed 提供受限数学表达式解析。
 *
 * 表达式使用白名单函数与常量，不调用 eval 或 new Function。strict 模式拒绝未声明名称，但允许内置常量；plot 模式允许单字母隐式参数。对象属性访问和未允许的函数调用始终会被拒绝。
 *
 * 支持的语法：
 *   expr    := term (('+' | '-') term)*
 *   term    := unary (('*' | '/' | '%') unary)*
 *   unary   := ('-' | '+') unary | power
 *   power   := atom ('^' atom)?
 *   atom    := number | variable | constant | func '(' expr ')' | '(' expr ')'
 *   constant: 'pi' | 'e' | 'tau'
 *   func    : sin cos tan asin acos atan sqrt cbrt exp log ln abs floor ceil round min max pow
 */
export interface SafeMathOptions {
    /** 字段值；strict 模式还允许使用未被字段覆盖的内置常量。 */
    vars?: Record<string, number>;
    /** 关闭 plot 使用的单字母隐式参数。 */
    allowImplicitVariables?: boolean;
    /** 面板上下文确定前解析追加项引用；未绑定的值按 NaN 处理，不提供运行时备用值。 */
    allowUnboundVariables?: boolean;
}
export interface SafeMathProgram {
    /** 计算编译后的表达式；plot 模式使用传入的 x 作为采样值。 */
    evaluate: (x: number) => number;
    /** 表达式引用的已声明字段名称；strict 模式下同名字段可以覆盖内置常量。 */
    variables: string[];
}
export declare const SAFE_MATH_LIMITS: {
    readonly maxExpressionLength: 512;
    readonly maxDepth: 32;
};
/** 解析十进制输入，拒绝 JavaScript Number 接受的非十进制进制写法。 */
export declare function parseDecimalNumber(value: string): number | undefined;
/**
 * 编译表达式以便后续计算。
 * @param expr - 数学表达式；默认模式将 `x` 作为采样变量，strict 模式按已声明字段解析。
 * @param options - 字段值和变量解析规则。
 * @returns 可执行的计算函数；表达式无效时返回 null。
 */
export declare function compileMathExpr(expr: string, options?: SafeMathOptions): ((x: number) => number) | null;
/**
 * 编译安全数学表达式，并返回表达式引用的字段名称。
 *
 * @param expr - 受限算术表达式。
 * @param options - 字段值和变量解析规则。
 * @returns 编译后的程序；表达式无效时返回 null。
 */
export declare function compileMathExprProgram(expr: string, options?: SafeMathOptions): SafeMathProgram | null;
/**
 * 在指定范围内采样表达式。
 * @param expr - 使用 x 和可选参数的数学表达式。
 * @param xMin - 采样起点。
 * @param xMax - 采样终点。
 * @param samples - 采样点数量，至少为 2。
 * @param params - 参数值；参数变化时会重新编译表达式。
 * @returns 有限的 [x, y] 坐标对。
 */
export declare function sampleExpr(expr: string, xMin: number, xMax: number, samples?: number, params?: Record<string, number>): Array<[number, number]>;
