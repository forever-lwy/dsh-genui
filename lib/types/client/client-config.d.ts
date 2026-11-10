import { type GenuiConfig } from '../shared/genui-config.ts';
export declare function getClientConfig(): GenuiConfig;
/** Replace the settings from a raw row value (partial or absent fields use defaults). */
export declare function setClientConfig(raw: unknown): void;
export declare function subscribeClientConfig(listener: () => void): () => void;
export declare function useClientConfig(): GenuiConfig;
