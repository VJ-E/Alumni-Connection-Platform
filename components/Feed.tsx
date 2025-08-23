"use client";

import React, { useState, useEffect } from 'react';
import PostInput from './PostInput'
import Posts from './Posts'
import { getAllPosts } from '@/lib/serveractions';
import { Button } from './ui/button';
import { useOnlineStatus } from './OfflineIndicator';
import { toast } from 'sonner';

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
    const isOnline = useOnlineStatus();

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const fetchedPosts = await getAllPosts();
                // Filter out any posts without proper user data
                const validPosts = fetchedPosts.filter(post => post && post.user);
                setPosts(validPosts);
                
                // Cache posts for offline use
                if ('caches' in window) {
                    const cache = await caches.open('dynamic-v1.0.0');
                    const response = new Response(JSON.stringify(validPosts), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    await cache.put('/api/posts', response);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
                
                // Try to get cached posts if offline
                if (!isOnline && 'caches' in window) {
                    try {
                        const cache = await caches.open('dynamic-v1.0.0');
                        const cachedResponse = await cache.match('/api/posts');
                        if (cachedResponse) {
                            const cachedPosts = await cachedResponse.json();
                            setPosts(cachedPosts);
                            toast.info('Showing cached posts (offline mode)');
                            setLoading(false);
                            return;
                        }
                    } catch (cacheError) {
                        console.error('Error reading cached posts:', cacheError);
                    }
                }
                
                setError('Failed to load posts. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [isOnline]);

    if (!user) {
        return <div className="text-center py-4 text-foreground">Please sign in to view posts.</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">{error}</div>;
    }

    return (
        <div className='flex-1'>
            <PostInput />
            {loading ? (
                <div className="text-center py-4 text-foreground">Loading posts...</div>
            ) : (
                <Posts posts={posts} />
            )}
        </div>
    );
}

export default Feed