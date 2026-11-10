import type { GenuiTable } from './spec.ts';
type TableCell = GenuiTable['rows'][number][number];
/** Display the same computed value in the table and in its exports. */
export declare function tableCellText(value: unknown): string;
/** Markdown table text for the copy action (pipes escaped). */
export declare function tableToMarkdown(columns: string[], rows: Array<Array<TableCell>>): string;
/** CSV text for the copy action, with the web renderer's existing escaping. */
export declare function tableToCsv(rows: Array<Array<TableCell>>): string;
export {};
