import { authMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
export default authMiddleware({
  publicRoutes: [
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/waiting-verification",
    "/api/webhook(.*)",
    "/api/uploadthing",
    "/api/users/check-onboarding", // Allow onboarding check without auth
    "/api/users/user_(.*)", // Allow user profile access without auth for public profiles
    "/api/auth/check-verification" // Allow verification check
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
  afterAuth: async (auth, req) => {
    const url = req.nextUrl;
    const pathname = url.pathname;

    // If user is signed in
    if (auth.userId) {
      // If visiting auth pages, redirect to home or waiting page
      if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
        const redirectUrl = new URL('/', req.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Skip verification check for API routes and static files
      if (pathname.startsWith('/api/') || 
          pathname.startsWith('/_next/') || 
          pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|json)$/)) {
        return NextResponse.next();
      }

      // Check if user is admin or verified
      try {
        const baseUrl = `${url.protocol}//${url.host}`;
        const userResponse = await fetch(`${baseUrl}/api/users/${auth.userId}`);
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          
          // If user is admin, skip verification check
          if (userData.role === 'admin') {
            return NextResponse.next();
          }
          
          // For non-admin users, check verification status
          const verificationResponse = await fetch(`${baseUrl}/api/auth/check-verification`, {
            headers: {
              'Content-Type': 'application/json',
              'Cookie': req.headers.get('cookie') || ''
            }
          });
          
          if (verificationResponse.ok) {
            const { isVerified } = await verificationResponse.json();
            
            // If user is not verified and not on the onboarding/waiting page, redirect to waiting page
            if (!isVerified && !pathname.startsWith('/onboarding') && !pathname.startsWith('/waiting-verification')) {
              const waitingUrl = new URL('/waiting-verification', req.url);
              return NextResponse.redirect(waitingUrl);
            }

            // If user is verified and on the waiting page, redirect to home
            if (isVerified && pathname.startsWith('/waiting-verification')) {
              const homeUrl = new URL('/', req.url);
              return NextResponse.redirect(homeUrl);
            }
          }
        }
      } catch (error) {
        console.error('Error checking user verification status:', error);
        // In case of error, allow access but log the error
      }
    }

    // If not signed in and route is protected, Clerk will handle 401 → redirect via publicRoutes
    return NextResponse.next();
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