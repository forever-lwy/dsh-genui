import type { StyleSpecification } from 'maplibre-gl';
import type { GenuiMap } from './spec.ts';
import type { MapController, MapMountOptions } from './map-lazy.ts';
export declare function offlineMapStyle(): StyleSpecification;
/** Follow the shortest segment at the dateline without changing stored WGS84 data. */
export declare function unwrapRoute(points: readonly [number, number][]): [number, number][];
export declare function mountMap(container: HTMLElement, initial: GenuiMap, initialSelection: string, options: MapMountOptions): MapController;
