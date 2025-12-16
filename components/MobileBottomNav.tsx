"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, Briefcase, User } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { Button } from './ui/button';
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SignOutButton } from "@clerk/nextjs";
import Image from 'next/image';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const { profile } = useCurrentUserProfile(user?.id);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side - People and Opportunities */}
        <div className="flex items-center gap-6">
          <Link
            href="/people"
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 min-w-[60px] touch-manipulation ${
              isActive("/people")
                ? "text-primary scale-110 bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
            }`}
          >
            <Users className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">People</span>
          </Link>
          
          <Link
            href="/opportunities"
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 min-w-[60px] touch-manipulation ${
              isActive("/opportunities")
                ? "text-primary scale-110 bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
            }`}
          >
            <Briefcase className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Jobs</span>
          </Link>
        </div>

        {/* Center - Home */}
        <Link
          href="/"
          className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 min-w-[60px] touch-manipulation ${
            isActive("/")
              ? "text-primary scale-110 bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
          }`}
        >
          <Home className="h-7 w-7 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* Right side - Messages and Profile */}
        <div className="flex items-center gap-6">
          <Link
            href="/messages"
            className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 min-w-[60px] touch-manipulation ${
              pathname.startsWith("/messages")
                ? "text-primary scale-110 bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
            }`}
          >
            <MessageSquare className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">Chat</span>
          </Link>

          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`flex flex-col items-center p-3 h-auto min-w-[60px] transition-all duration-200 touch-manipulation ${
                    pathname.startsWith("/profile")
                      ? "text-primary scale-110 bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95"
                  }`}
                >
                  <div className="relative h-6 w-6 rounded-full mb-1">
                    <Image
                      src={profile?.profilePhoto || "/default-avatar.png"}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium">Profile</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mb-2">
                <Link href={user ? `/profile/${user.id}` : "/profile"}>
                  <DropdownMenuItem className="cursor-pointer">
                    View Profile
                  </DropdownMenuItem>
                </Link>
                <SignOutButton>
                  <DropdownMenuItem className="cursor-pointer text-destructive">
                    Sign Out
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          </SignedIn>
          
          <SignedOut>
            <div className="flex flex-col items-center p-3 min-w-[60px]">
              <SignInButton>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mb-1 touch-manipulation">
                  <User className="h-6 w-6" />
                </Button>
              </SignInButton>
              <span className="text-xs font-medium">Sign In</span>
            </div>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
