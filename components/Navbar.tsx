"use client";

import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import SearchInput from './SearchInput';
import NavItems from './NavItems';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { Button } from './ui/button';
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { Menu } from "lucide-react"; // hamburger icon
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const Navbar = () => {
  const router = useRouter();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile } = useCurrentUserProfile(user?.id);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return (
    <div className="fixed w-full bg-background z-50 shadow-sm border-b border-border">
      <div className="flex items-center max-w-6xl justify-between h-14 mx-auto px-3">
        {/* Logo & Search */}
        <div className="flex items-center gap-2">
          <Image
            src={"/kit_logo.png"}
            alt="Logo"
            width={50}
            height={50}
          />
          <h1 className="text-2xl font-bold hidden md:block text-foreground">Alumni Connection</h1>
          {/* <div className="hidden md:block">
            <SearchInput />
          </div> */}
        </div>

        {/* Desktop Nav + Profile */}
        <div className="hidden md:flex items-center gap-5">
          <NavItems />
          {/* Theme toggle button - only render after mount to avoid hydration mismatch */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="transition-colors duration-300"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <span className="sr-only">Toggle theme</span>
              {theme === "dark" ? (
                <Sun className="h-6 w-6 text-foreground transition-transform duration-300 rotate-0 scale-100" />
              ) : (
                <Moon className="h-6 w-6 text-foreground transition-transform duration-300 rotate-0 scale-100" />
              )}
            </Button>
          )}
          <SignedIn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Image
                    src={profile?.profilePhoto || "/default-avatar.png"}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
            <Button className="rounded-full" variant={"secondary"}>
              <SignInButton />
            </Button>
          </SignedOut>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background shadow p-4 flex flex-col gap-2 border-t border-border">
          <Link href="/">HomePage</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/opportunities">Opportunities</Link>
          <Link href="/people">People</Link>
          <Link href="/messages">Messages</Link>
          <SignedIn>
            <SignOutButton>
              <span className="text-destructive cursor-pointer">Sign Out</span>
            </SignOutButton>
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>
      )}
    </div>
  );
};

export default Navbar;
