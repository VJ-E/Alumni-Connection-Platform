"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Heart, MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { likePostAction, dislikePostAction } from "@/lib/serveractions";
import Comments from "./Comments";
import { toast } from "react-toastify";
import { useOnlineStatus } from "./OfflineIndicator";

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

const SocialOptions = ({ post }: { post: SafePost }) => {
  const { user } = useUser();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.id || '') || false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [isLoading, setIsLoading] = useState(false);
  const isOnline = useOnlineStatus();

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    if (isLoading) return;

    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }

    try {
      setIsLoading(true);
      if (isLiked) {
        await dislikePostAction(post._id);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await likePostAction(post._id);
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-around py-1 sm:py-2 px-1 sm:px-2">
        <Button
          onClick={handleLike}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg transition-colors ${
            isLiked 
              ? 'text-destructive hover:bg-destructive/10' 
              : 'text-muted-foreground hover:bg-muted/50'
          }`}
        >
          <Heart className={`w-5 h-5 sm:w-4 sm:h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likeCount}</span>
        </Button>
        <Button
          onClick={() => setShowComments(!showComments)}
          variant="ghost"
          size="sm"
          className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-2 sm:px-3 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4" />
          <span className="text-sm font-medium">
            <span className="hidden sm:inline"> </span>
            {post.comments?.length || 0}
            <span className="hidden sm:inline"> Comments</span>
          </span>
        </Button>
      </div>
      {showComments && (
        <div className="border-t border-border bg-muted/5">
          <Comments postId={post._id} initialComments={post.comments || []} />
        </div>
      )}
    </div>
  );
};

export default SocialOptions;
