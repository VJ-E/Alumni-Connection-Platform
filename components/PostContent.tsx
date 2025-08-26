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
    <div className="mt-2">
      <div className="text-sm text-foreground break-words" dangerouslySetInnerHTML={{ __html: linkify(post.description) }} />
      {post.imageUrl && (
        <div className="relative w-full mt-3 rounded-lg overflow-hidden border border-border">
          <div className="relative w-full aspect-video">
            <Image
              src={post.imageUrl}
              alt="Post image"
              fill
              className="object-contain bg-card"
              sizes="(max-width: 768px) 100vw, 768px"
              priority={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PostContent;