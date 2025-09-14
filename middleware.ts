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
    const isPublicRoute = [
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/waiting-verification',
      '/onboarding'
    ].some(route => new RegExp(`^${route}$`).test(pathname));

    // Skip verification check for public routes, API routes, and static files
    if (pathname.startsWith('/api/') || 
        pathname.startsWith('/_next/') || 
        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|json|css|js)$/)) {
      return NextResponse.next();
    }

    // If user is not signed in and route is not public, redirect to sign-in
    if (!auth.userId) {
      if (!isPublicRoute) {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', pathname);
        return NextResponse.redirect(signInUrl);
      }
      return NextResponse.next();
    }

    // User is signed in
    try {
      const baseUrl = `${url.protocol}//${url.host}`;
      
      // Skip verification for API routes and public paths
      if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
        return NextResponse.next();
      }
      
      // Get user data from the database
      const userResponse = await fetch(`${baseUrl}/api/users/${auth.userId}`, {
        headers: {
          'Cookie': req.headers.get('cookie') || ''
        },
        // Important: Don't cache this request
        cache: 'no-store'
      });
      
      if (!userResponse.ok) {
        console.error('Failed to fetch user data:', await userResponse.text());
        return NextResponse.next(); // Continue with the request if we can't verify
      }
      
      const userData = await userResponse.json();
      
      // If user is admin, allow access to all routes
      if (userData.role === 'admin') {
        // If admin is on auth pages, redirect to home
        if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
          return NextResponse.redirect(new URL('/', req.url));
        }
        return NextResponse.next();
      }
      
      // For non-admin users, check if they have completed onboarding
      if (!userData.graduationYear) {
        if (!pathname.startsWith('/onboarding')) {
          return NextResponse.redirect(new URL('/onboarding', req.url));
        }
        return NextResponse.next();
      }
      
      // If user has completed onboarding but is not verified
      if (!userData.isVerified) {
        if (!pathname.startsWith('/waiting-verification')) {
          return NextResponse.redirect(new URL('/waiting-verification', req.url));
        }
        return NextResponse.next();
      }
      
      // If user is verified, redirect away from onboarding/waiting pages
      if (pathname.startsWith('/waiting-verification') || pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    } catch (error) {
      console.error('Error in middleware:', error);
      // In case of error, redirect to sign-in to be safe
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
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