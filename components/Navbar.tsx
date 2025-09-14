"use client";

import Image from 'next/image';
import React, { useState } from 'react';
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

const Navbar = () => {
  const router = useRouter();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile } = useCurrentUserProfile(user?.id);
  return (
    <div className="fixed w-full bg-white z-50 shadow-sm">
      <div className="flex items-center max-w-6xl justify-between h-14 mx-auto px-3">
        {/* Logo & Search */}
        <div className="flex items-center gap-2">
          <Image
            src={"/kit_logo.png"}
            alt="Logo"
            width={60}
            height={60}
          />
          <div className="hidden md:block">
            <SearchInput />
          </div>
        </div>

        {/* Desktop Nav + Profile */}
        <div className="hidden md:flex items-center gap-5">
          <NavItems />
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
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    View Profile
                  </DropdownMenuItem>
                </Link>
                <SignOutButton>
                  <DropdownMenuItem className="cursor-pointer text-red-600">
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
        <div className="md:hidden bg-white shadow p-4 flex flex-col gap-2">
          <Link href="/">Feed</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/opportunities">Opportunities</Link>
          <Link href="/people">People</Link>
          <SignedIn>
            <SignOutButton>
              <span className="text-red-600 cursor-pointer">Sign Out</span>
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
