/**
 * Mounted GenUI blocks by element (fork: forever-lwy): the whole-answer
 * exporter walks the reply's DOM and asks each block for its artifact
 * (spec + current interaction state) instead of re-parsing fence text.
 * @module @forever-lwy/dsh-genui/client/artifact/registry
 */
import type { GenuiArtifactV1 } from './types.ts'

const blocks = new WeakMap<Element, () => GenuiArtifactV1>()

export function registerExportableBlock(element: Element, getArtifact: () => GenuiArtifactV1): () => void {
  blocks.set(element, getArtifact)
  return () => {
    if (blocks.get(element) === getArtifact) blocks.delete(element)
  }
}

export function exportableBlockOf(element: Element): (() => GenuiArtifactV1) | undefined {
  return blocks.get(element)
}
