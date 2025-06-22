"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

const NavbarWrapper = () => {
    const pathname = usePathname();
    const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up');

    if (isAuthPage) {
        return null;
    }

    return <Navbar />;
};

export default NavbarWrapper; 