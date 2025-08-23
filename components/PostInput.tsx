"use client";
import React, { useState } from "react";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Input } from "./ui/input";
import { PostDialog } from "./PostDialog";
import { toast } from "react-toastify";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useUser } from "@clerk/nextjs";
import { useOnlineStatus } from "./OfflineIndicator";

const PostInput = () => {
  const { user } = useUser();
  const { profile } = useCurrentUserProfile(user?.id);
  const [open, setOpen] = useState<boolean>(false);
  const isOnline = useOnlineStatus();
  const inputHandler = () => {
    if (!user) {
      toast.error("Please Login first")
      return
    }
    
    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }
    
    setOpen(true);
  };
  return (
    <div className="bg-card text-card-foreground p-4 m-2 md:m-0 border border-border rounded-lg">
      <div className="flex items-center gap-3">
        <ProfilePhoto src={profile?.profilePhoto || "./default-avator.png"} />
        <Input
          type="text"
          placeholder="Share something..."
          className="rounded-full hover:bg-accent/50 h-12 cursor-pointer transition-colors"
          onClick={inputHandler}
        />
        <PostDialog
          setOpen={setOpen}
          open={open}
          src={profile?.profilePhoto || "./default-avator.png"}
          fullName={user ? `${user?.firstName} ${user?.lastName}` : "Full name"}
        />
      </div>
    </div>
  );
};

export default PostInput;
