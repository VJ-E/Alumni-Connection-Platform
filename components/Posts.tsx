"use client";

import React, { useState } from 'react';
import Post from './Post';
import { Button } from './ui/button';

export interface SafePost {
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
        role: string;
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
            role: string;
        };
        createdAt: string;
        updatedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

interface PostsProps {
    posts: SafePost[];
    onLike?: (postId: string, userId: string) => void;
    onComment?: (postId: string, comment: any) => void;
}

const Posts = ({ posts, onLike, onComment }: PostsProps) => {
  return (
    <div className="w-full max-w-full">
      <div className="space-y-4 w-full max-w-full">
        {posts?.map((post) => (
          post && post.user && (
            <Post 
              key={post._id} 
              post={post} 
              onLike={onLike ? () => onLike(post._id, post.user.userId) : undefined}
              onComment={onComment ? (comment: any) => onComment(post._id, comment) : undefined}
            />
          )
        ))}
        {(!posts || posts.length === 0) && (
          <div className="text-center py-8 bg-card/50 text-muted-foreground rounded-lg border border-border">
            <p className="text-gray-500">
              No posts found.
            </p>
          </div>
        )}
      </div>
    </div>
  );

}

export default Posts;