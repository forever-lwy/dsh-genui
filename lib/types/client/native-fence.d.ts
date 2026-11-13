/** Native Markdown fence layers. The host owns discovery, streaming and React lifetime. */
import { type ReactNode } from 'react';
import type { Context } from '@deepseek-ai/cordis';
import type { SessionId } from '@deepseek-ai/dsh-session/types';
import type { HocShare, PropsRuntime, SlotMap } from '@deepseek-ai/dsh-client-ui-slots';
import { type FileLinkAvailability } from './file-link-context.tsx';
type FenceProps = PropsRuntime<'conversation.chat.markdown.fence'> & HocShare<SlotMap['conversation.chat.markdown.fence']>;
type SendAction = (sessionId: SessionId, action: string, payload: Record<string, unknown>) => void;
/** The native seat is session scoped; DOM is read only for the stable message anchor. */
export declare function createNativeFenceLayer(ctx: Context, sendAction: SendAction, availability: FileLinkAvailability): ({ lang, code, streaming, sessionId, children }: FenceProps) => ReactNode;
/** Register only GenUI-owned languages; ordinary JSON and unlabelled code stay code. */
export declare function installNativeFenceRenderer(ctx: Context, sendAction: SendAction, availability: FileLinkAvailability): () => void;
export {};
