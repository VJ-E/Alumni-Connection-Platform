"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import PostInput from './PostInput';
import Posts from './Posts';
import { getAllPosts } from '@/lib/serveractions';
import { useOnlineStatus } from './OfflineIndicator';
import { toast } from 'sonner';
import DepartmentFilter from './DepartmentFilter';

export interface SafeUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string;
    emailAddresses: string[];
}

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

interface FeedProps {
    user: SafeUser | null;
}

const Feed = ({ user }: FeedProps) => {
    const [posts, setPosts] = useState<SafePost[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedTab, setSelectedTab] = useState<'all' | 'student' | 'alumni'>('all');
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const department = searchParams?.get('dept') || 'all';
    const isOnline = useOnlineStatus();
    
    // Function to determine if a post matches the selected filters
    const filterPost = (post: SafePost) => {
        try {
            // If post is invalid, filter it out
            if (!post || typeof post !== 'object') return false;
            
            // If we have a user filter selected
            if (selectedTab !== 'all') {
                // Make sure post.user exists and has the expected structure
                if (!post.user || typeof post.user !== 'object') return false;
                
                // Safely get the user role
                const userRole = post.user.role?.toLowerCase?.();
                if (!userRole) return false; // If no role, filter out
                
                // Apply the selected tab filter
                if (selectedTab === 'student' && userRole !== 'student') return false;
                if (selectedTab === 'alumni' && userRole !== 'alumni') return false;
            }
            
            // If we got here, the post passes all filters
            return true;
        } catch (error) {
            console.error('Error filtering post:', error, post);
            return false; // Filter out posts that cause errors
        }
    };

    // Function to fetch posts with pagination
    const fetchPosts = useCallback(async (currentPage: number, isInitialLoad = false) => {
        if ((!isInitialLoad && !hasMore) || loading || loadingMore) return;

        const loadingState = isInitialLoad ? setLoading : setLoadingMore;
        loadingState(true);
        
        setError(null);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        try {
            const skip = (currentPage - 1) * 10;
            console.log(`Fetching posts - page: ${currentPage}, skip: ${skip}, department: ${department}`);
            
            const response = await getAllPosts(
                department !== 'all' ? department : undefined,
                10,
                skip
            );
            
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid server response');
            }
            
            if (!Array.isArray(response.posts)) {
                console.error('Invalid posts data:', response);
                throw new Error('Received invalid posts data from server');
            }
            
            const { posts: newPosts = [], hasMore: morePosts = false } = response;
            console.log(`Received ${newPosts.length} posts, hasMore: ${morePosts}`);
            
            setPosts(prevPosts => {
                // If it's the initial load, replace the posts, otherwise append
                const updatedPosts = isInitialLoad 
                    ? [...newPosts] 
                    : [...prevPosts, ...newPosts];
                console.log(`Updated posts count: ${updatedPosts.length}`);
                return updatedPosts;
            });
            
            setHasMore(morePosts);
            
            if (isInitialLoad && newPosts.length > 0) {
                try {
                    localStorage.setItem('cachedPosts', JSON.stringify(newPosts));
                    if ('caches' in window) {
                        const cache = await caches.open('dynamic-v1.0.0');
                        const responseData = new Response(JSON.stringify(newPosts), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                        await cache.put('/api/posts', responseData);
                    }
                } catch (cacheError) {
                    console.warn('Failed to cache posts:', cacheError);
                }
            }
        } catch (fetchError) {
            console.error('Error fetching posts:', fetchError);
            
            if (isInitialLoad) {
                try {
                    const cachedPosts = localStorage.getItem('cachedPosts');
                    if (cachedPosts) {
                        const parsedPosts = JSON.parse(cachedPosts);
                        if (Array.isArray(parsedPosts)) {
                            setPosts(parsedPosts);
                            setError('Showing cached posts. Some posts may be outdated.');
                            return;
                        }
                    }
                } catch (cacheError) {
                    console.error('Error reading from cache:', cacheError);
                }
            }
            
            if (isInitialLoad || posts.length === 0) {
                const errorMessage = fetchError instanceof Error 
                    ? fetchError.message 
                    : 'Failed to load posts. Please check your connection and try again.';
                setError(`Error: ${errorMessage}`);
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            setLoadingMore(false);
        }
    }, [department]); // Removed hasMore, loading, loadingMore, posts.length from dependencies

    // Effect for initial load and filter changes
    useEffect(() => {
        let isMounted = true;
        
        const loadInitialData = async () => {
            if (isMounted) {
                setPosts([]);
                setPage(1);
                setHasMore(true);
                await fetchPosts(1, true);
            }
        };
        
        loadInitialData();
        
        return () => {
            isMounted = false;
        };
    }, [department, selectedTab, isOnline]);

    // Effect for loading more posts
    useEffect(() => {
        let isMounted = true;
        
        if (page > 1 && isMounted) {
            fetchPosts(page);
        }
        
        return () => {
            isMounted = false;
        };
    }, [page]);

    // Infinite scroll with intersection observer
    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setPage(prevPage => prevPage + 1);
                }
            },
            { 
                root: null,
                rootMargin: '20px',
                threshold: 0.1 
            }
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasMore, loading, loadingMore]);

    const handleNewPost = (newPost: SafePost) => {
        setPosts(prevPosts => [newPost, ...prevPosts]);
    };

    const handleLike = (postId: string, userId: string) => {
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post._id === postId) {
                    const isLiked = post.likes?.includes(userId);
                    return {
                        ...post,
                        likes: isLiked
                            ? post.likes?.filter(id => id !== userId)
                            : [...(post.likes || []), userId]
                    };
                }
                return post;
            })
        );
    };

    const handleComment = (postId: string, comment: any) => {
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post._id === postId) {
                    return {
                        ...post,
                        comments: [...(post.comments || []), comment]
                    };
                }
                return post;
            })
        );
    };



    if (error) {
        return <div className="text-center py-4 text-red-500">Error loading posts. Please try again later.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto w-full px-4 py-4">
            {!user ? (
                <div className="text-center py-4 text-foreground">Please sign in to view posts.</div>
            ) : (
                <>
                    <PostInput onNewPost={handleNewPost} />
                    <div className="mt-4 mb-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                {(['all', 'student', 'alumni'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        className={`px-3 py-1.5 text-sm rounded-full capitalize transition-colors ${
                                            selectedTab === tab
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                                        }`}
                                        onClick={() => setSelectedTab(tab)}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                            <div className="hidden sm:block h-6 w-px bg-border mx-1" />
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">Department:</span>
                                <DepartmentFilter variant="dropdown" />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            <Posts posts={posts.filter(filterPost)} onLike={handleLike} onComment={handleComment} />
                            {loadingMore && (
                                <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            )}
                            <div ref={loadMoreRef} className="h-1" />
                            {!hasMore && posts.length > 0 && (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    You&apos;ve reached the end of the feed
                                </div>
                            )}
                            {!loading && posts.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No posts found. Be the first to post something!
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Feed;