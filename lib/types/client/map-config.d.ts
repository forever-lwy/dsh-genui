/** Structural inline-style carrier with all vendor extension fields preserved.
 * Hosts may use their own MapLibre StyleSpecification for deeper static checking.
 * Runtime style validation remains MapLibre's responsibility, not the model guard.
 */
export type GenuiMapStyle = {
    version: 8;
    sources: Record<string, unknown>;
    layers: readonly unknown[];
    [name: string]: unknown;
};
export interface GenuiMapConfig {
    /** Host-owned inline style. Its sources, sprites and glyphs may use network. */
    style: GenuiMapStyle;
}
/** Optional embedding boundary; absent means a source-free offline map. */
export declare const GenuiMapContext: import("react").Context<GenuiMapConfig | undefined>;
/** Host-plugin integration; call with reviewed configuration, never model JSON. */
export declare function setGenuiMapConfig(config: GenuiMapConfig | undefined): void;
export declare function useGenuiMapConfig(): GenuiMapConfig | undefined;
