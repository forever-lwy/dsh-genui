import type { GenuiNode, GenuiSpec } from '../client/spec.ts';
import type { NativeState, NativeView } from './dsh-go-types.ts';
export type NativeSurface = 'tool' | 'fence' | 'panel';
export interface NativeAction {
    node: GenuiNode;
    key: string;
    kind?: 'tab' | 'accordion' | 'reset';
}
export declare const nativeIdentity: (spec: GenuiSpec) => string;
/** The original web spec stays authoritative; native limitations are visible. */
export declare function compileDshGo(spec: GenuiSpec, surface: NativeSurface, state?: NativeState, locale?: string, generation?: string): {
    view: {
        title?: string;
        type: string;
    };
    actions: Map<string, NativeAction>;
    issues: string[];
    identity: string;
};
/** The published native budgets; refuse truncation of meaningful content. */
export declare function fitsNativeView(view: NativeView, surface: NativeSurface): boolean;
/** Fixed stack root is deliberately unknown to the web component vocabulary. */
export declare function dualNativeFence(spec: GenuiSpec): Record<string, unknown> | null;
