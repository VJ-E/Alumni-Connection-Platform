"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Heart, MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { likePostAction, dislikePostAction } from "@/lib/serveractions";
import Comments from "./Comments";
import { toast } from "react-toastify";

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

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    if (isLoading) return;

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
    <div className="border-t">
      <div className="flex items-center gap-4 p-2">
        <Button
          onClick={handleLike}
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : ''}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span>{likeCount}</span>
        </Button>
        <Button
          onClick={() => setShowComments(!showComments)}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments?.length || 0}</span>
        </Button>
      </div>
      {showComments && <Comments post={post} />}
    </div>
  );
};

export default SocialOptions;
