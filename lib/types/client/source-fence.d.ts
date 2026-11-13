export interface SourceFence {
    lang: string | null;
    value: string;
    openingLineComplete: boolean;
}
/**
 * 按 Markdown 文档顺序读取所有代码围栏。
 *
 * @param markdown - assistant text block 中的 Markdown 内容
 * @returns Markdown AST 中的代码围栏
 */
export declare function sourceFencesOf(markdown: string): SourceFence[];
