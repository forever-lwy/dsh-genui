import type { GenuiMap } from './spec.ts';
/** GeoJSON order: longitude, latitude. Invalid coordinates are never clamped. */
export declare const MAP_MERCATOR_LATITUDE = 85.051129;
export declare function isMapProjectable(point: readonly [number, number]): boolean;
export declare function mapCoordinate(value: unknown): [number, number] | undefined;
export declare function repairMap(value: unknown): GenuiMap | null;
export declare function validateMap(v: Record<string, unknown>, at: string, errors: string[]): void;
/** Smallest longitude interval, including points straddling the antimeridian. */
export declare function mapBounds(points: readonly [number, number][]): [[number, number], [number, number]] | undefined;
