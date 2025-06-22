"use client";

import Image from 'next/image'
import React from 'react'
import SearchInput from './SearchInput'
import NavItems from './NavItems'
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs'
import { Button } from './ui/button'
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

const Navbar = () => {
    const router = useRouter();
    const { user } = useUser();

    return (
        <div className='fixed w-full bg-white z-50 shadow-sm'>
            <div className=' flex items-center max-w-6xl justify-between h-14 mx-auto px-3'>
                <div className='flex items-center gap-2'>
                    <Image
                        src={'/kit_logo.png'}
                        alt="Logo"
                        width={60}
                        height={60}
                    />
                    <div className='md:block hidden'>
                        <SearchInput />
                    </div>
                </div>
                <div className='flex items-center gap-5'>
                    <div className='md:block hidden'>
                        <NavItems />
                    </div>
                    <div>
                        <SignedIn>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Image
                                            src={user?.imageUrl || "/default-avatar.png"}
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
                            <Button className='rounded-full' variant={'secondary'}>
                                <SignInButton/>
                            </Button>
                        </SignedOut>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar