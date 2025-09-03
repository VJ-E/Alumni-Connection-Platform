"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import CommentInput from './CommentInput';
import Image from 'next/image';

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

const Comments = ({ post }: { post: SafePost }) => {
  const { user } = useUser();
  const [showAllComments, setShowAllComments] = useState(false);
  const commentsToShow = showAllComments ? post.comments : post.comments?.slice(0, 3);

  if (!user) return null;

  return (
    <div className="border-t p-4 space-y-4">
      <CommentInput postId={post._id} />
      
      <div className="space-y-4">
        {commentsToShow?.map((comment) => (
          <div key={comment._id} className="flex items-start gap-2">
            <div className="relative w-8 h-8">
              <Image
                src={comment.user.profilePhoto}
                alt={`${comment.user.firstName}'s profile`}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="font-semibold text-sm">
                  {comment.user.firstName} {comment.user.lastName}
                </div>
                <p className="text-sm">{comment.textMessage}</p>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(comment.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {post.comments && post.comments.length > 3 && (
        <button
          onClick={() => setShowAllComments(!showAllComments)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showAllComments ? 'Show less' : `View all ${post.comments.length} comments`}
        </button>
      )}
    </div>
  );
};

export default Comments;