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

const Posts = ({ posts }: { posts: SafePost[] }) => {
  const [filter, setFilter] = useState<'all' | 'students' | 'alumni' | 'admin'>('all');
  const currentYear = new Date().getFullYear();

  const filteredPosts = posts?.filter(post => {
    if (!post?.user) return false;
    if (filter === 'all') return true;
    
    const graduationYear = post.user.graduationYear || currentYear;
    // Alumni are those who have graduated (graduation year is less than current year)
    // Students are those who will graduate in the current year or future
    const isAlumni = graduationYear < currentYear;
    
    return (filter === 'admin' && post.user.role === 'admin') || (filter === 'alumni' && isAlumni && post.user.role !== 'admin') || (filter === 'students' && !isAlumni && post.user.role !== 'admin');
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-[4rem] z-10">
        <Button
          variant="ghost"
          className="hover:bg-accent/50 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          onClick={() => setFilter('all')}
          data-state={filter === 'all' ? 'active' : 'inactive'}
        >
          All Posts
        </Button>
        <Button
          variant="ghost"
          className="hover:bg-accent/50 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          onClick={() => setFilter('students')}
          data-state={filter === 'students' ? 'active' : 'inactive'}
        >
          Student Posts
        </Button>
        <Button
          variant="ghost"
          className="hover:bg-accent/50 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          onClick={() => setFilter('alumni')}
          data-state={filter === 'alumni' ? 'active' : 'inactive'}
        >
          Alumni Posts
        </Button>
        <Button
          variant="ghost"
          className="hover:bg-accent/50 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
          onClick={() => setFilter('admin')}
          data-state={filter === 'admin' ? 'active' : 'inactive'}
        >
          Admin Posts
        </Button>
      </div>
      
      <div className="space-y-4 p-4">
        {filteredPosts?.map((post) => (
          post && post.user && <Post key={post._id} post={post} />
        ))}
        {(!filteredPosts || filteredPosts.length === 0) && (
          <div className="text-center py-8 bg-card/50 text-muted-foreground rounded-lg border border-border">
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