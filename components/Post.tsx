"use client";
import React from "react";
import ProfilePhoto from "./shared/ProfilePhoto";
import { useUser } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import PostContent from "./PostContent";
import SocialOptions from "./SocialOptions";
import ReactTimeago from "react-timeago";
import { deletePostAction } from "@/lib/serveractions";
import { useAuth } from "@clerk/nextjs";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { toast } from "sonner";
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
            role: string;
            graduationYear: number | null;
        };
        createdAt: string;
        updatedAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

const Post = ({ post }: { post: SafePost }) => {
  const { user } = useUser();
  const fullName = post?.user?.firstName + " " + post?.user?.lastName;
  const loggedInUser = user?.id === post?.user?.userId;
  const currentYear = new Date().getFullYear();
  const role = post?.user?.role;
  const isAlumni = post?.user?.graduationYear ? post.user.graduationYear < currentYear : false;
  const currentUser = useCurrentUserProfile(user?.id);
  const isOnline = useOnlineStatus();

  if (!post?.user) {
    return null;
  }
  // console.log("role--------------------------", role,fullName);
  return (
    <div className="bg-card text-card-foreground my-2 rounded-lg border border-border overflow-hidden">
      <div className="flex gap-3 p-3 sm:p-4">
        <div className="flex-shrink-0">
          <ProfilePhoto src={post.user.profilePhoto} userId={post.user.userId} className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <h1 className="text-sm font-bold truncate">
                  {fullName}
                </h1>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant={"secondary"} className="text-[10px] sm:text-xs h-4">
                    {post.user.role === 'admin' ? 'Admin' : isAlumni ? 'Alumni' : 'Student'}
                  </Badge>
                  {loggedInUser && (
                    <Badge variant={"outline"} className="text-[10px] sm:text-xs h-4">
                      You
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {typeof post.user.graduationYear === 'number' ? `Batch of ${post.user.graduationYear}` : 'Graduation year not set'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                <ReactTimeago date={post.createdAt} />
              </p>
            </div>
            <div className="flex-shrink-0">
              {(loggedInUser || currentUser?.profile?.role === 'admin') && (
                <Button
                  onClick={() => {
                    if (!isOnline) {
                      toast.error("You are offline. Please check your connection and try again.");
                      return;
                    }
                    deletePostAction(post._id);
                  }}
                  variant={"ghost"}
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <PostContent post={post} />
          <SocialOptions post={post} />
        </div>
      </div>
    </div>
  );
};

export default Post;
