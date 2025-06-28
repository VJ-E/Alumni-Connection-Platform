"use client";

import { useEffect, useState, useRef } from "react";
import { IMessage } from "@/models/message.model";
import { IUser } from "@/models/user.model";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { getConnectionStatus, getMessages, sendMessage, uploadChatImage } from "@/lib/serveractions";
import { toast } from "react-toastify";
import { Images } from "lucide-react";
import Image from "next/image";

// Helper function to convert URLs to clickable links
const convertUrlsToLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-200 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function ChatWindow({
  currentUser,
  otherUser,
}: {
  currentUser: any;
  otherUser: IUser;
}) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedMessages, status] = await Promise.all([
          getMessages(otherUser.userId),
          getConnectionStatus(otherUser.userId)
        ]);
        setMessages(fetchedMessages);
        setConnectionStatus(status);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [otherUser.userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle image file selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setImageUploading(true);
      toast.info("Uploading image...");

      // Convert file to base64
      const reader = new FileReader();
      const imageDataPromise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imageData = await imageDataPromise;
      console.log("Starting image upload to Cloudinary...");
      const imageUrl = await uploadChatImage(imageData as string);

      console.log("Image uploaded successfully, sending message...");
      const message = await sendMessage(otherUser.userId, "", imageUrl);
      
      if (message) {
        console.log("Message with image sent successfully");
        setMessages((prev) => [...prev, message]);
        toast.success("Image sent successfully");
      }
    } catch (error) {
      console.error("Error in image upload/send:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send image. Please try again.");
    } finally {
      setImageUploading(false);
      e.target.value = ""; // Clear the input
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || connectionStatus !== 'accepted') return;

    try {
      const message = await sendMessage(otherUser.userId, newMessage);
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (connectionStatus !== 'accepted') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-semibold mb-4">Cannot Send Messages</h2>
        <p className="text-gray-500 text-center">
          You need to be connected with {otherUser.firstName} to send messages.
          {connectionStatus === 'pending' && " A connection request is pending."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-4">
          <ProfilePhoto src={otherUser.profilePhoto || "/default-avatar.png"} />
          <div>
            <h2 className="font-semibold">
              {otherUser.firstName} {otherUser.lastName}
            </h2>
            <p className="text-sm text-gray-500">Connected</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message._id as string}
              className={`flex ${
                message.senderId === currentUser.userId ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === currentUser.userId
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                {message.imageUrl && (
                  <div className="mb-2">
                    <Image
                      src={message.imageUrl}
                      alt="Sent image"
                      width={0}
                      height={0}
                      sizes="(max-width: 768px) 85vw, (max-width: 1200px) 60vw, 40vw"
                      className="rounded w-auto h-auto max-w-full"
                      style={{ maxHeight: '60vh' }}
                    />
                  </div>
                )}
                {message.content && <p className="break-words">{convertUrlsToLinks(message.content)}</p>}
                <p className="text-xs mt-1 opacity-70">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2 items-end">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            rows={1}
          />
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
              disabled={imageUploading}
            />
            <Images className={`w-6 h-6 ${imageUploading ? 'text-gray-400' : 'text-gray-500 hover:text-blue-500'}`} />
          </label>
          <Button type="submit" disabled={!newMessage.trim() || imageUploading}>
            Send
          </Button>
        </div>
        {imageUploading && (
          <p className="text-sm text-blue-500 mt-1">Uploading image...</p>
        )}
      </form>
    </div>
  );
}