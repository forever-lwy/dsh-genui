export declare class AnswerExportError extends Error {
}
/**
 * The assistant rows of the turn that `anchor` (an element inside that
 * turn's action row) belongs to, in document order.
 */
export declare function collectAnswerRows(anchor: Element): HTMLElement[];
export interface AnswerExportOptions {
    /** Title for the file name and the page; defaults to the document title. */
    title?: string;
}
/** Build the export document for the answer `anchor` belongs to. */
export declare function buildAnswerHtml(anchor: Element, options?: AnswerExportOptions): Promise<string>;
/** Build and download; resolves once the download has been handed to the browser. */
export declare function downloadAnswerHtml(anchor: Element, options?: AnswerExportOptions): Promise<void>;
