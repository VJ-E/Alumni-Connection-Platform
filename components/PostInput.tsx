"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Input } from "./ui/input";
import { PostDialog } from "./PostDialog";
import { toast } from "react-toastify";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import { useOnlineStatus } from "./OfflineIndicator";

const PostInput = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { profile } = useCurrentUserProfile(userId);
  const [open, setOpen] = useState<boolean>(false);
  const isOnline = useOnlineStatus();

  const inputHandler = () => {
    if (!session?.user) {
      toast.error("Please login first");
      return;
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
        <ProfilePhoto src={profile?.profilePhoto || "/default-avatar.png"} />
        <Input
          type="text"
          placeholder="Share something..."
          className="rounded-full hover:bg-accent/50 h-12 cursor-pointer transition-colors"
          onClick={inputHandler}
        />
        <PostDialog
          setOpen={setOpen}
          open={open}
          src={profile?.profilePhoto || "/default-avatar.png"}
          fullName={
            session?.user
              ? `${session.user.name}`
              : "Full name"
          }
        />
      </div>
    </div>
  );
};

export default PostInput;
