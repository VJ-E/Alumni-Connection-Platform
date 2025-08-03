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

  if (!post?.user) {
    return null;
  }
  // console.log("role--------------------------", role,fullName);
  return (
    <div className="bg-card text-card-foreground my-2 mx-2 md:mx-0 rounded-lg border border-border">
      <div className="flex gap-2 p-4">
        <ProfilePhoto src={post.user.profilePhoto} userId={post.user.userId} />
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-sm font-bold flex items-center">
              {fullName}
              <Badge variant={"secondary"} className="ml-2">
                {post.user.role === 'admin' ? 'Admin' : isAlumni ? 'Alumni' : 'Student'}
              </Badge>
              {loggedInUser && (
                <Badge variant={"outline"} className="ml-2">
                  You
                </Badge>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              {typeof post.user.graduationYear === 'number' ? `Batch of ${post.user.graduationYear}` : 'Graduation year not set'}
            </p>
            <p className="text-xs text-muted-foreground">
              <ReactTimeago date={post.createdAt} />
            </p>
          </div>
        </div>
        <div>
          {(loggedInUser || currentUser?.profile?.role === 'admin') && (
            <Button
              onClick={() => {
                deletePostAction(post._id);
              }}
              size={"icon"}
              className="rounded-full"
              variant={"outline"}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
      <PostContent post={post} />
      <SocialOptions post={post} />
    </div>
  );
};

export default Post;
