import Image from 'next/image'
import React from 'react'
import { Avatar, AvatarImage } from '../ui/avatar'
import Link from 'next/link'

const ProfilePhoto = ({ src, alt = "Profile photo", userId }: { src: string; alt?: string; userId?: string }) => {
    const avatar = (
            <Avatar className='cursor-pointer hover:ring-2 hover:ring-ring transition-all'>
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