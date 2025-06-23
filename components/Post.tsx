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

const Post = ({ post }: { post: SafePost }) => {
  const { user } = useUser();
  const fullName = post?.user?.firstName + " " + post?.user?.lastName;
  const loggedInUser = user?.id === post?.user?.userId;
  const currentYear = new Date().getFullYear();
  const isAlumni = post?.user?.graduationYear ? post.user.graduationYear < currentYear : false;

  if (!post?.user) {
    return null;
  }

  return (
    <div className="bg-white my-2 mx-2 md:mx-0 rounded-lg border border-gray-300">
      <div className="flex gap-2 p-4">
        <ProfilePhoto src={post.user.profilePhoto} />
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-sm font-bold flex items-center">
              {fullName}
              <Badge variant={"secondary"} className="ml-2">
                {isAlumni ? 'Alumni' : 'Student'}
              </Badge>
              {loggedInUser && (
                <Badge variant={"outline"} className="ml-2">
                  You
                </Badge>
              )}
            </h1>
            <p className="text-xs text-gray-500">
              {typeof post.user.graduationYear === 'number' ? `Batch of ${post.user.graduationYear}` : 'Graduation year not set'}
            </p>
            <p className="text-xs text-gray-500">
              <ReactTimeago date={post.createdAt} />
            </p>
          </div>
        </div>
        <div>
          {loggedInUser && (
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
