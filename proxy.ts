import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Next.js 16 proxy (replaces middleware.ts).
 * Uses edge-safe auth config — no Prisma/Node.js dependencies.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo-mad.png (static assets)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|logo-mad\\.png).*)",
  ],
};
