import type { Context } from '@deepseek-ai/cordis';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
import type { GenuiSpec } from '../client/spec.ts';
import type { NativeState } from './dsh-go-types.ts';
interface StateRecord {
    document: string;
    state: NativeState;
}
declare module '@deepseek-ai/dsh-session' {
    interface PluginRecordMap {
        'plugin:dsh-genui/native-state': StateRecord;
    }
}
export interface NativeDocument {
    spec: GenuiSpec;
    source: number;
    generation: string;
    stateIdentity: string;
    valid: boolean;
}
/** Ordered replay of committed results and closed fences; never pending tool args. */
export declare function nativeDocument(events: readonly SessionEvent[], sessionId: string): NativeDocument | null;
/** Native services are optional, late-bound, and owned by the plugin lifetime. */
export declare function installDshGoNative(ctx: Context): void;
export {};
