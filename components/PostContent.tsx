"use client";

import React from 'react';
import Image from 'next/image';

function linkify(text: string): string {
  const urlRegex = /(\bhttps?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">${url}</a>`;
  });
}


interface SafePost {
    _id: string;
    description: string;
    user: {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        profilePhoto: string;
        description: string;
        graduationYear: number | null;
    };
    imageUrl?: string;
    likes?: string[];
    comments?: Array<{
        _id: string;
        textMessage: string;
        user: {
            userId: string;
            firstName: string;
            lastName: string;
            email: string;
            profilePhoto: string;
            description: string;
            graduationYear: number | null;
        };
        createdAt: string;
        updatedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

const PostContent = ({ post }: { post: SafePost }) => {
  return (
    <div className="px-4 pb-2">
      <p className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: linkify(post.description) }}/>
      {post.imageUrl && (
        <div className="relative w-full h-96 mt-2">
          <Image
            src={post.imageUrl}
            alt="Post image"
            fill
            className="object-contain"
          />
        </div>
      )}
    </div>
  );
};

export default PostContent;