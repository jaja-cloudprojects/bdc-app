// In-memory token blacklist keyed by JTI.
// For multi-instance deployments, replace with a shared Redis store.
const blacklistedJtis = new Set<string>();

export function revokeToken(jti: string): void {
  blacklistedJtis.add(jti);
}

export function isRevoked(jti: string): boolean {
  return blacklistedJtis.has(jti);
}
