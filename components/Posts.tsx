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
  const [filter, setFilter] = useState<'all' | 'students' | 'alumni'>('all');
  const currentYear = new Date().getFullYear();

  const filteredPosts = posts?.filter(post => {
    if (!post?.user) return false;
    if (filter === 'all') return true;
    
    const graduationYear = post.user.graduationYear || currentYear;
    // Alumni are those who have graduated (graduation year is less than current year)
    // Students are those who will graduate in the current year or future
    const isAlumni = graduationYear < currentYear;
    
    return (filter === 'alumni' && isAlumni && post.user.role !== 'admin') || (filter === 'students' && !isAlumni && post.user.role !== 'admin');
  });

  return (
    <div className="w-full max-w-full">
      <div className="sticky top-[4rem] z-10 bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="relative">
          <div className="flex overflow-x-auto no-scrollbar px-2 py-2 sm:px-4 sm:py-3">
            <div className="flex flex-nowrap gap-1.5 sm:gap-3">
              {[
                { id: 'all', label: 'All Posts' },
                { id: 'students', label: 'Student Posts' },
                { id: 'alumni', label: 'Alumni Posts' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={`px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap rounded-full transition-colors
                    ${filter === tab.id 
                      ? 'bg-accent text-accent-foreground font-medium' 
                      : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* Gradient fade effect for the right edge */}
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 pointer-events-none" style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 80%)'
          }} />
        </div>
      </div>
      
      <div className="space-y-4 p-2 sm:p-4 w-full max-w-full">
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