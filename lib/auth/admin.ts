import { prisma } from "@/lib/database/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  getSession,
  setSessionCookie,
  clearSessionCookie,
  type SessionPayload,
} from "@/lib/auth/session";

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<SessionPayload | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") return null;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name ?? undefined,
  };
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<boolean> {
  const session = await authenticateAdmin(email, password);
  if (!session) return false;
  const token = await createSessionToken(session);
  await setSessionCookie(token);
  return true;
}

export async function logoutAdmin(): Promise<void> {
  await clearSessionCookie();
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
