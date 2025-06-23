"use client";
import React, { useState } from "react";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Input } from "./ui/input";
import { PostDialog } from "./PostDialog";
import { toast } from "react-toastify";

const PostInput = ({ user }: { user: any }) => {
  const [open, setOpen] = useState<boolean>(false);
  const inputHandler = () => {
    if (!user) {
      toast.error("Please Login first")
      return
    }
    setOpen(true);
  };
  return (
    <div className="bg-white p-4 m-2 md:m-0 border border-gray-300 rounded-lg">
      <div className="flex items-center gap-3">
        <ProfilePhoto src={user?.imageUrl || "./default-avator.png"} />
        <Input
          type="text"
          placeholder="Share something..."
          className="rounded-full hover:bg-gray-100 h-12 cursor-pointer"
          onClick={inputHandler}
        />
        <PostDialog
          setOpen={setOpen}
          open={open}
          src={user?.imageUrl}
          fullName={user ? `${user?.firstName} ${user?.lastName}` : "Full name"}
        />
      </div>
    </div>
  );
};

export default PostInput;
