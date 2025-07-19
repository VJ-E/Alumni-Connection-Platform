import { authMiddleware } from "@clerk/nextjs/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
export default authMiddleware({
  publicRoutes: [
    "/sign-in",
    "/sign-up",
    "/api/webhook",
    "/",
    "/_next/static/*",
    "/favicon.ico",
    "/kit_logo.png",
    "/banner.jpg",
    "/login-banner.jpg",
    "/default-avator.png"
  ],
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};