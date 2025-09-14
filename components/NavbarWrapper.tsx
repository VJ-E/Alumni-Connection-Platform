"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

const NavbarWrapper = () => {
    const pathname = usePathname();
    // Hide navbar on auth, onboarding, and waiting-verification pages
    const hideNavbar = [
        '/sign-in',
        '/sign-up',
        '/onboarding',
        '/waiting-verification'
    ].some(route => pathname?.startsWith(route));

    if (hideNavbar) {
        return null;
    }

    return <Navbar />;
};

export default NavbarWrapper; 