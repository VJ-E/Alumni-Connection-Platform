"use client";

import React, { useState } from 'react';
import Post from './Post';
import { Button } from './ui/button';

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

const Posts = ({ posts }: { posts: SafePost[] }) => {
  const [filter, setFilter] = useState<'all' | 'students' | 'alumni'>('all');
  const currentYear = new Date().getFullYear();

  const filteredPosts = posts?.filter(post => {
    if (!post?.user) return false;
    if (filter === 'all') return true;
    
    const graduationYear = post.user.graduationYear || currentYear;
    // Alumni are those who have graduated (graduation year is less than current year)
    // Students are those who will graduate in the current year or future
    const isAlumni = graduationYear < currentYear;
    
    return (filter === 'alumni' && isAlumni) || (filter === 'students' && !isAlumni);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-4 border-b bg-white sticky top-[4rem] z-10">
        <Button
          variant="ghost"
          onClick={() => setFilter('all')}
          className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
          data-state={filter === 'all' ? 'active' : 'inactive'}
        >
          All Posts
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFilter('students')}
          className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
          data-state={filter === 'students' ? 'active' : 'inactive'}
        >
          Student Posts
        </Button>
        <Button
          variant="ghost"
          onClick={() => setFilter('alumni')}
          className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900"
          data-state={filter === 'alumni' ? 'active' : 'inactive'}
        >
          Alumni Posts
        </Button>
      </div>
      
      <div className="space-y-4 p-4">
        {filteredPosts?.map((post) => (
          post && post.user && <Post key={post._id} post={post} />
        ))}
        {(!filteredPosts || filteredPosts.length === 0) && (
          <div className="text-center py-8 bg-white rounded-lg border">
            <p className="text-gray-500">
              No posts found for this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Posts;