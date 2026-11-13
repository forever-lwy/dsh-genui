/** Code surfaces inside an explicitly registered sidechat root. */
export function codeBlockSurfaces(scope: ParentNode): HTMLElement[] {
  const surfaces = new Set(scope.querySelectorAll<HTMLElement>('.md-code-block, .code-block, .code-block-small'))
  for (const content of scope.querySelectorAll<HTMLElement>('[data-code-block-content]')) {
    if (content.parentElement !== null) surfaces.add(content.parentElement)
  }
  return [...surfaces].sort((left, right) => left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
}
