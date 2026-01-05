import { getAccessToken } from "./cookies";
import { verifyToken, AccessTokenPayload } from "./jwt";

/**
 * Server-side helper to get the current user's session from cookies
 */
export async function getSession(): Promise<AccessTokenPayload | null> {
    try {
        const token = await getAccessToken();
        if (!token) return null;
        return verifyToken<AccessTokenPayload>(token);
    } catch {
        return null;
    }
}
