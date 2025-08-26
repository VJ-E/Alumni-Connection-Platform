"use client";
import React, { useState } from 'react';
import ProfilePhoto from "./shared/ProfilePhoto";
import { useUser } from "@clerk/nextjs";
// Remove unused import
import { Button } from "./ui/button";
import { createCommentAction } from "@/lib/serveractions";
import { toast } from "react-toastify";
import { useOnlineStatus } from "./OfflineIndicator";

interface CommentInputProps {
  postId: string;
  onSuccess?: (newComment: any) => void;
}

const CommentInput = ({ postId, onSuccess }: CommentInputProps) => {
  const { user } = useUser();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnline = useOnlineStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newComment = await createCommentAction(postId, comment);
      setComment('');
      toast.success('Comment posted!');
      if (onSuccess && newComment) {
        onSuccess(newComment);
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2 w-full">
      <div className="flex-shrink-0 pt-1.5">
        <ProfilePhoto 
          src={user?.imageUrl || '/default-avatar.png'}
          alt={user?.fullName || 'User'}
          className="h-8 w-8 sm:h-9 sm:w-9"
        />
      </div>
      <div className="flex-1 flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 text-sm sm:text-base rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          disabled={isSubmitting}
        />
        <Button 
          type="submit" 
          size="sm"
          disabled={!comment.trim() || isSubmitting}
          className="rounded-lg px-3 sm:px-4 whitespace-nowrap h-10"
          variant={!comment.trim() ? 'ghost' : 'default'}
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  );
};

export default CommentInput;
