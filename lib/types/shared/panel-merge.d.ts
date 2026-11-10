import type { GenuiSpec } from '../client/spec.ts';
/**
 * Merge an `append` spec into the current panel spec:
 * - both sides single-tabs containers → merge BY TAB LABEL: items of
 *   same-labelled tabs are appended, new labels are added (order preserved);
 * - otherwise → plain item lists are appended to the tail.
 * The previous title wins unless it was absent. `next` is returned as-is when
 * there is nothing to merge into. Export for tests.
 */
export declare function mergePanelSpecs(prev: GenuiSpec | null, next: GenuiSpec): GenuiSpec;
