"use client";

import React, { useState, useEffect } from "react";
import PostInput from "./PostInput";
import Posts from "./Posts";
import { getAllPosts } from "@/lib/serveractions";
import { useOnlineStatus } from "./OfflineIndicator";
import { toast } from "sonner";

interface SafeUser {
  id: string;
  name: string;
  email: string;
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
        const validPosts = fetchedPosts.filter((post) => post && post.user);
        setPosts(validPosts);
      } catch (error) {
        console.error("Error fetching posts:", error);

        if (!isOnline) {
          toast.info("Showing cached posts (offline mode)");
        } else {
          setError("Failed to load posts. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [isOnline]);

  if (!user) {
    return (
      <div className="text-center py-4 text-foreground">
        Please sign in to view posts.
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="flex-1">
      <PostInput />
      {loading ? (
        <div className="text-center py-4 text-foreground">
          Loading posts...
        </div>
      ) : (
        <Posts posts={posts} />
      )}
    </div>
  );
};

export default Feed;