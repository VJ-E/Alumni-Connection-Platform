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
  ],
  ignoredRoutes: [
    "/api/webhook(.*)",
    "/_next/static/(.*)",
    "/favicon.ico",
  ]
});

// Stop Middleware running on static files and public folder
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};