import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;

        // Always allow auth routes
        if (
          pathname.startsWith("/login") ||
          pathname.startsWith("/register") ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // Allow public static files
        if (
          pathname.startsWith("/_next") ||
          pathname.startsWith("/api/auth") ||
          pathname === "/manifest.json" ||
          pathname === "/sw.js" ||
          pathname === "/offline.html" ||
          pathname === "/favicon.ico" ||
          pathname.endsWith(".png") ||
          pathname.endsWith(".jpg") ||
          pathname.endsWith(".svg") ||
          pathname.endsWith(".xml")
        ) {
          return true;
        }

        // For everything else, require a valid token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};