import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth configuration.
 * This config is used by proxy.ts (middleware replacement) and
 * does NOT import Prisma or any Node.js-only dependencies.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  providers: [], // Providers are added in auth.ts (not edge-safe)

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // Protected routes
      const protectedPaths = ["/dashboard"];
      // Include exactly the root path as well
      const isProtected = nextUrl.pathname === "/" || protectedPaths.some((path) =>
        nextUrl.pathname.startsWith(path),
      );

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // Redirect logged-in users away from auth pages
      const authPaths = ["/login", "/register"];
      const isAuthPage = authPaths.some((path) =>
        nextUrl.pathname.startsWith(path),
      );

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
