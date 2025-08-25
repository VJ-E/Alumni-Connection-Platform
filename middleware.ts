import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
export default authMiddleware({
  publicRoutes: [
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhook(.*)",
    "/api/uploadthing",
    "/api/users/check-onboarding", // Allow onboarding check without auth
    "/api/users/user_(.*)", // Allow user profile access without auth for public profiles
  ],
  ignoredRoutes: [
    "/api/webhook(.*)",
    "/_next/static/(.*)",
    "/favicon.ico",
    "/manifest.json",
    "/sw.js",
    "/offline.html",
    "/banner.jpg",
    "/kit_logo.png",
    "/default-avatar.png",
    "/default-group.png",
    "/login-banner.jpg",
    "/login-banner2.jpg",
    "/LinkedIn_icon.svg.png",
    "/LinkedIn_logo.png",
  ],
  // Redirect signed-in users away from auth pages; enforce sign-in on protected routes
  afterAuth(auth, req) {
    const url = req.nextUrl;
    const pathname = url.pathname;

    // If user is signed in and visiting auth routes, send to home
    if (auth.userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
      const redirectUrl = new URL('/', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // If not signed in and route is protected, Clerk will handle 401 → redirect via publicRoutes
    return;
  }
});

// Stop Middleware running on static files and public folder
export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)', 
    '/', 
    '/(api|trpc)(.*)'
  ],
};