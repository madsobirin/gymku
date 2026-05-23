import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated session.
 * Returns the session or null if not authenticated.
 */
export async function getSession() {
  return await auth();
}

/**
 * Get the current authenticated session or redirect to login.
 * Use this in protected server components/pages.
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

/**
 * Get the current authenticated user ID or redirect to login.
 * Convenience wrapper for getting just the user ID.
 */
export async function requireUserId() {
  const session = await requireAuth();
  return session.user.id;
}
