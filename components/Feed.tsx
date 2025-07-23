"use client";

import React, { useState, useEffect } from 'react';
import PostInput from './PostInput'
import Posts from './Posts'
import { getAllPosts } from '@/lib/serveractions';
import { Button } from './ui/button';

interface SafeUser {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
    emailAddresses: string[];
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

const Feed = ({ user }: { user: SafeUser | null }) => {
    const [posts, setPosts] = useState<SafePost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const fetchedPosts = await getAllPosts();
                // Filter out any posts without proper user data
                const validPosts = fetchedPosts.filter(post => post && post.user);
                setPosts(validPosts);
            } catch (error) {
                console.error('Error fetching posts:', error);
                setError('Failed to load posts. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (!user) {
        return <div className="text-center py-4">Please sign in to view posts.</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">{error}</div>;
    }

    return (
        <div className='flex-1'>
            <PostInput user={user}/>
            {loading ? (
                <div className="text-center py-4">Loading posts...</div>
            ) : (
                <Posts posts={posts} />
            )}
        </div>
    );
}

export default Feed