"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import NavItems from "./NavItems";
import { useSession, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import MobileBottomNav from "./MobileBottomNav";

const Navbar = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { profile } = useCurrentUserProfile(userId);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="fixed w-full bg-background z-50 shadow-sm border-b border-border">
        <div className="flex items-center max-w-6xl justify-between h-14 mx-auto px-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image src="/kit_logo.png" alt="Logo" width={50} height={50} />
            <h1 className="text-2xl font-bold hidden md:block text-foreground">
              Alumni Connection
            </h1>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-5">
            <NavItems />

            {/* Theme toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                onClick={() =>
                  setTheme(theme === "dark" ? "light" : "dark")
                }
              >
                {theme === "dark" ? (
                  <Sun className="h-6 w-6 text-foreground" />
                ) : (
                  <Moon className="h-6 w-6 text-foreground" />
                )}
              </Button>
            )}

            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Image
                      src={profile?.profilePhoto || "/default-avatar.png"}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
              <Link href="/login">
                <Button variant="secondary" className="rounded-full">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </>
  );
};

export default Navbar;
