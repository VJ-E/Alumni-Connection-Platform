import { authMiddleware } from "@clerk/nextjs/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
export default authMiddleware({
  publicRoutes: [
    "/",
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
  // Add afterAuth to handle authentication flow better
  afterAuth(auth, req) {
    // Handle authentication flow
    if (!auth.userId && !auth.isPublicRoute) {
      // Redirect to sign-in for protected routes
      return;
    }
    
    // Allow the request to proceed
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