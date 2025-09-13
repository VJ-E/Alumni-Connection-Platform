'use client';

import { useUser, SignOutButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut } from "lucide-react";

export default function WaitingVerificationPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!isLoaded || !user) return;
      
      try {
        setCheckingStatus(true);
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const userData = await response.json();
          if (userData.isVerified) {
            router.push('/');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      } finally {
        setLoading(false);
        setCheckingStatus(false);
      }
    };

    checkVerificationStatus();
    
    // Check verification status every 30 seconds
    const interval = setInterval(checkVerificationStatus, 30000);
    
    return () => clearInterval(interval);
  }, [isLoaded, user, router]);

  // No need for custom handleSignOut as we'll use Clerk's SignOutButton

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-blue-600"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <CardTitle>Verification in Progress</CardTitle>
          <CardDescription className="text-base">
            Thank you for submitting your information. Your account is currently under review by our admin team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              We&apos;ll notify you once your account has been verified. This usually takes 24-48 hours.
            </p>
            {checkingStatus && (
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking verification status...</span>
              </div>
            )}
          </div>
          <div className="pt-4">
            <SignOutButton>
              <Button 
                variant="outline" 
                disabled={checkingStatus}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
