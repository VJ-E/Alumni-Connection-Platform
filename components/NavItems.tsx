"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, MessageSquare, LogOut, Briefcase } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "./ui/button";

export default function NavItems() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="flex flex-row items-center space-x-4">
      <Link
        href="/"
        className={`p-3 rounded-lg transition-colors ${
          isActive("/")
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100 text-gray-600"
        }`}
      >
        <Home className="h-6 w-6" />
      </Link>

      <Link
        href="/people"
        className={`p-3 rounded-lg transition-colors ${
          isActive("/people")
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100 text-gray-600"
        }`}
      >
        <Users className="h-6 w-6" />
      </Link>

      <Link
        href="/opportunities"
        className={`p-3 rounded-lg transition-colors ${
          isActive("/opportunities")
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100 text-gray-600"
        }`}
      >
        <Briefcase className="h-6 w-6" />
      </Link>

      <Link
        href="/messages"
        className={`p-3 rounded-lg transition-colors ${
          pathname.startsWith("/messages")
            ? "bg-blue-100 text-blue-600"
            : "hover:bg-gray-100 text-gray-600"
        }`}
      >
        <MessageSquare className="h-6 w-6" />
      </Link>

      {/* <div className="mt-auto">
        <SignOutButton>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </SignOutButton>
      </div> */}
    </div>
  );
}