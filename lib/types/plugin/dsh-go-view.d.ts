import type { GenuiSpec } from '../client/spec.ts';
import type { NativeView } from './dsh-go-types.ts';
/** A complete read-only projection; tool cards have no native action handler. */
export declare function toDshGoView(spec: GenuiSpec): NativeView | null;
