/**
 * The plugin row's settings as the browser half sees them (fork: forever-lwy).
 *
 * The client entry feeds this store from `configForms` (the same row the
 * settings page edits); hosts without that service keep the defaults. Readers
 * outside React call {@link getClientConfig}; components use
 * {@link useClientConfig} and re-render when a setting changes.
 * @module @forever-lwy/dsh-genui/client/client-config
 */
import { useSyncExternalStore } from 'react'
import { DEFAULT_GENUI_CONFIG, snapshotGenuiConfig, type GenuiConfig } from '../shared/genui-config.ts'

let current: GenuiConfig = DEFAULT_GENUI_CONFIG
const listeners = new Set<() => void>()

export function getClientConfig(): GenuiConfig {
  return current
}

/** Replace the settings from a raw row value (partial or absent fields use defaults). */
export function setClientConfig(raw: unknown): void {
  const next = snapshotGenuiConfig(raw)
  if (JSON.stringify(next) === JSON.stringify(current)) return
  current = next
  for (const listener of [...listeners]) listener()
}

export function subscribeClientConfig(listener: () => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function useClientConfig(): GenuiConfig {
  return useSyncExternalStore(subscribeClientConfig, getClientConfig, getClientConfig)
}
