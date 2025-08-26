"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import CommentInput from './CommentInput';
import Image from 'next/image';
import ReactTimeago from 'react-timeago';

interface Comment {
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
}

interface CommentsProps {
  postId: string;
  initialComments?: Comment[];
}

const Comments = ({ postId, initialComments = [] }: CommentsProps) => {
  const { user } = useUser();
  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const commentsToShow = showAllComments ? comments : comments.slice(0, 3);

  if (!user) return null;

  const handleNewComment = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev]);
  };

  return (
    <div className="p-3 sm:p-4 space-y-3">
      <CommentInput postId={postId} onSuccess={handleNewComment} />
      
      {comments.length > 0 && (
        <div className="space-y-3">
          {commentsToShow.map((comment) => (
            <div key={comment._id} className="flex gap-2">
              <div className="flex-shrink-0">
                <Image
                  src={comment.user.profilePhoto || '/default-avatar.png'}
                  alt={`${comment.user.firstName} ${comment.user.lastName}`}
                  width={32}
                  height={32}
                  className="rounded-full h-8 w-8 object-cover mt-1"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/20 rounded-xl p-2 sm:p-3">
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="text-sm font-medium truncate">
                      {comment.user.firstName} {comment.user.lastName}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">
                      <ReactTimeago date={comment.createdAt} />
                    </span>
                  </div>
                  <p className="text-sm mt-1 break-words">{comment.textMessage}</p>
                </div>
              </div>
            </div>
          ))}
          {comments.length > 3 && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left py-1 px-2 rounded-lg hover:bg-muted/30"
            >
              View all {comments.length} comments
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Comments;