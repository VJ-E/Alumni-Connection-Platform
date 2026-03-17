"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, Briefcase, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Image from "next/image";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { profile } = useCurrentUserProfile(userId);

  const isActive = (path: string) => pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left side */}
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

        {/* Right side */}
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

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center p-3 h-auto min-w-[60px] transition-all duration-200 touch-manipulation ${
                    pathname.startsWith("/profile")
                      ? "text-primary scale-110 bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
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
                <Link href={`/profile/${userId}`}>
                  <DropdownMenuItem className="cursor-pointer">
                    View Profile
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="flex flex-col items-center p-3 min-w-[60px] text-muted-foreground"
            >
              <User className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
