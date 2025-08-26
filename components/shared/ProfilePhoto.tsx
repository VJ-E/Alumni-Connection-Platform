import Image from 'next/image'
import React from 'react'
import { Avatar, AvatarImage } from '../ui/avatar'
import Link from 'next/link'

interface ProfilePhotoProps {
    src: string;
    alt?: string;
    userId?: string;
    className?: string;
}

const ProfilePhoto = ({ src, alt = "Profile photo", userId, className = '' }: ProfilePhotoProps) => {
    const avatar = (
            <Avatar className={`cursor-pointer hover:ring-2 hover:ring-ring transition-all ${className}`.trim()}>
                <AvatarImage 
                    src={src} 
                    alt={alt}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </Avatar>
    );
    if (userId) {
        return <Link href={`/profile/${userId}`}>{avatar}</Link>;
    }
    return <div className="inline-flex">{avatar}</div>;
}

export default ProfilePhoto