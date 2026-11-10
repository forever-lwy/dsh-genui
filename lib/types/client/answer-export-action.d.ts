/**
 * "Export answer" in a finished assistant message's action row (fork:
 * forever-lwy). One click downloads the answer as HTML with its rendering;
 * progress and failures show as the button's tooltip text and a short note.
 * @module @forever-lwy/dsh-genui/client/answer-export-action
 */
import { type ComponentType, type ReactNode } from 'react';
type TooltipLike = ComponentType<{
    label: string;
    side?: string;
    children: ReactNode;
}>;
/** Factory so the host primitives' Tooltip (when present) wraps the button. */
export declare function createAnswerExportAction(Tooltip?: TooltipLike, sessionTitle?: (sessionId: unknown) => string | undefined): (props: {
    messageId?: unknown;
    sessionId?: unknown;
}) => import("react").JSX.Element | null;
export {};
