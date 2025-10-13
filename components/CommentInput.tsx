"use client";
import React, { useState } from 'react';
import ProfilePhoto from "./shared/ProfilePhoto";
import { useUser } from "@clerk/nextjs";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { createCommentAction } from "@/lib/serveractions";
import { toast } from "react-toastify";

const CommentInput = ({ postId }: { postId: string }) => {
  const { user } = useUser();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    try {
      setIsSubmitting(true);
      await createCommentAction(postId, comment);
      setComment('');
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <Button 
        type="submit" 
        disabled={!comment.trim() || isSubmitting}
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isSubmitting ? 'Posting...' : 'Post'}
      </Button>
    </form>
  );
};

export default CommentInput;
