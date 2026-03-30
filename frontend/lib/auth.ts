/**
 * auth.ts — Frontend Cognito auth helpers
 *
 * Uses the ID token (not access token) because:
 * - It contains the `sub` claim our backend uses as userId
 * - API Gateway Cognito authorizer accepts ID tokens
 *
 * Token is stored in sessionStorage["idToken"].
 * sessionStorage clears automatically when the tab closes.
 */
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { COGNITO } from "./cognito";

export const userPool = new CognitoUserPool({
  UserPoolId: COGNITO.userPoolId,
  ClientId: COGNITO.clientId,
});

/**
 * Login with email + password.
 * Stores the ID token in sessionStorage on success.
 */
export function login(email: string, password: string): Promise<string> {
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password,
  });

  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session: CognitoUserSession) => {
        const idToken = session.getIdToken().getJwtToken();
        sessionStorage.setItem("idToken", idToken);
        resolve(idToken);
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: () => reject(new Error("NEW_PASSWORD_REQUIRED")),
    });
  });
}

/**
 * Returns the current ID token, refreshing silently if expired.
 * Returns null if the user is not logged in.
 */
export function getSession(): Promise<string | null> {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) {
          resolve(null);
          return;
        }
        const idToken = session.getIdToken().getJwtToken();
        sessionStorage.setItem("idToken", idToken);
        resolve(idToken);
      },
    );
  });
}

/**
 * Clears sessionStorage and signs out from Cognito.
 */
export function logout(): void {
  sessionStorage.removeItem("idToken");
  userPool.getCurrentUser()?.signOut();
}

/**
 * Returns true if a token exists in sessionStorage.
 * Quick synchronous check — use getSession() for a verified check.
 */
export function isLoggedIn(): boolean {
  return !!sessionStorage.getItem("idToken");
}
