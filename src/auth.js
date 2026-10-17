export function createAuthMiddleware(allowedUserIds) {
  const idSet = new Set(allowedUserIds.map(String));

  return async function authMiddleware(ctx, next) {
    const userId = ctx.from?.id;
    if (userId !== undefined && idSet.has(String(userId))) {
      return next();
    }
    // Silently ignore unauthorized requests to prevent enumeration attacks
  };
}
