import { createHmac } from "crypto";

export const COOKIE_NAME = "auth_token";

const TOKEN_PAYLOAD = "authenticated";

export function generateToken(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(TOKEN_PAYLOAD).digest("hex");
}

export function verifyToken(token: string): boolean {
  return token === generateToken();
}
