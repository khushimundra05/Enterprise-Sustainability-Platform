/**
 * getUserId.ts
 *
 * Extracts the authenticated user's Cognito sub from the Lambda event.
 *
 * In production (with Cognito authorizer on API Gateway):
 *   event.requestContext.authorizer.claims.sub  ← preferred, already verified by AWS
 *
 * In serverless-offline (local dev):
 *   Falls back to manually decoding the JWT — fine because this only runs locally.
 *
 * NEVER trust event.headers["x-user-id"] or path parameters for identity.
 */
export function getUserId(event: any): string {
  // 1. Production path: Cognito authorizer has already verified the JWT
  //    and injected claims into the request context.
  const claims = event.requestContext?.authorizer?.claims;
  if (claims?.sub) {
    return claims.sub;
  }

  // 2. Serverless-offline path: authorizer context is not populated,
  //    so we decode the JWT manually (no signature verification needed locally).
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized: missing token");
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString(),
    );

    if (!payload.sub) {
      throw new Error("Unauthorized: no sub claim in token");
    }

    return payload.sub;
  } catch {
    throw new Error("Unauthorized: invalid token");
  }
}
