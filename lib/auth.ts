import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const COOKIE_NAME = "auth_token";
const BCRYPT_ROUNDS = 12;

// --- Password hashing ---

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- Session tokens ---
// Format: userId.timestamp.random.signature

export function generateSessionToken(userId: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");

  const timestamp = Date.now().toString(36);
  const random = randomBytes(16).toString("hex");
  const payload = `${userId}.${timestamp}.${random}`;
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

export function verifySessionToken(
  token: string
): { userId: string } | null {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [userId, timestamp, random, signature] = parts;
  const payload = `${userId}.${timestamp}.${random}`;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (signature !== expected) return null;

  return { userId };
}

// --- Session helpers ---

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const parsed = verifySessionToken(token);
  if (!parsed) return null;

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      email: true,
      role: true,
      isActive: true,
      passwordChangedAt: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) return null;

  return user;
}

// --- Bootstrap password detection ---

export function isUsingBootstrapPassword(user: {
  passwordChangedAt: Date;
  createdAt: Date;
}): boolean {
  return (
    Math.abs(
      user.passwordChangedAt.getTime() - user.createdAt.getTime()
    ) < 1000
  );
}
