const revokedTokenCache = new Set<string>();

export function revokeTokenLocally(token: string) {
  if (token) revokedTokenCache.add(token);
}

export function isTokenLocallyRevoked(token: string): boolean {
  return revokedTokenCache.has(token);
}
