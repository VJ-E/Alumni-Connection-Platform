import Image from 'next/image'
import React from 'react'
import { Avatar, AvatarImage } from '../ui/avatar'

const ProfilePhoto = ({ src, alt = "Profile photo" }: { src: string; alt?: string }) => {
    return (
        <div>
            <Avatar className='cursor-pointer'>
                <AvatarImage 
                    src={src} 
                    alt={alt}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </Avatar>
        </div>
    )
}

export default ProfilePhoto