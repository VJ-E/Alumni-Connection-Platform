'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Routes that don't require onboarding check
  const excludedRoutes = [
    '/onboarding',
    '/sign-in',
    '/sign-up',
    '/api',
    '/_next',
    '/favicon.ico'
  ];

  // Check if current path should be excluded
  const shouldExcludeRoute = excludedRoutes.some(route => 
    pathname?.startsWith(route)
  );

  useEffect(() => {
    if (!isLoaded) return;

    // If user is not signed in, don't check onboarding
    if (!user) {
      setIsChecking(false);
      return;
    }

    // If route is excluded, don't check onboarding
    if (shouldExcludeRoute) {
      setIsChecking(false);
      return;
    }

    // Prevent infinite redirects
    if (hasRedirected) {
      setIsChecking(false);
      return;
    }

    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      try {
        console.log('Checking onboarding status for user:', user.emailAddresses[0].emailAddress);
        const response = await fetch(`/api/users/check-onboarding?email=${encodeURIComponent(user.emailAddresses[0].emailAddress)}`);
        
        if (response.ok) {
          // User has completed onboarding, allow access
          console.log('User has completed onboarding, allowing access');
          setIsChecking(false);
        } else if (response.status === 404) {
          // User hasn't completed onboarding, redirect
          console.log('User has not completed onboarding, redirecting to /onboarding');
          setHasRedirected(true);
          router.push('/onboarding');
        } else {
          // Some other error, allow access for now
          console.warn('Error checking onboarding status, allowing access');
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, allow access to prevent blocking users
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, isLoaded, pathname, shouldExcludeRoute, router, hasRedirected]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
