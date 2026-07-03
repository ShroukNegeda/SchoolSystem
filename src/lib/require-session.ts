import { redirect } from "next/navigation";
import { getSession, SessionPayload } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function requireRole(role: Role): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== role) redirect("/login");
  return session;
}
