"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { createCommentAction } from "@/lib/serveractions";
import { toast } from "react-toastify";
import { useOnlineStatus } from "./OfflineIndicator";

const CommentInput = ({ postId }: { postId: string }) => {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnline = useOnlineStatus();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !session?.user) return;

    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createCommentAction(postId, comment);
      setComment("");
      toast.success("Comment posted successfully!");
    } catch (error) {
      console.error("Failed to create comment:", error);
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session?.user) return null;

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
        {isSubmitting ? "Posting..." : "Post"}
      </Button>
    </form>
  );
};

export default CommentInput;
