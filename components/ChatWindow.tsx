"use client";

import { useEffect, useState, useRef } from "react";
import { IMessage } from "@/models/message.model";
import { IUser } from "@/models/user.model";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { getConnectionStatus, sendMessage as sendMessageToServer } from "@/lib/serveractions";
import { toast } from "react-toastify";
import { Images } from "lucide-react";
import Image from "next/image";
import { useSocket } from "@/contexts/SocketContext";
import { useOnlineStatus } from "./OfflineIndicator";
import { useSession } from "next-auth/react";

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
  currentUser: {
    userId: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  otherUser: IUser;
}) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const { socket } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [otherUserLastReadAt, setOtherUserLastReadAt] = useState<Date | null>(null);
  const isOnline = useOnlineStatus();
  const { data: session } = useSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [status, { messages: initialMessages }] = await Promise.all([
          getConnectionStatus(otherUser.userId),
          fetch(`/api/messages?receiverId=${otherUser.userId}`).then((res) =>
            res.json()
          ),
        ]);

        setConnectionStatus(status);
        if (Array.isArray(initialMessages)) {
          setMessages(initialMessages);
        }

        try {
          const res = await fetch(
            `/api/messages/readStatus?partnerId=${otherUser.userId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.lastReadAt) {
              setOtherUserLastReadAt(new Date(data.lastReadAt));
            }
          }
        } catch (err) {
          console.warn("Failed to fetch read status:", err);
        }

        try {
          await fetch("/api/messages/markAsRead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partnerId: otherUser.userId }),
          });
        } catch (err) {
          console.warn("markAsRead failed:", err);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, [otherUser.userId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: IMessage) => {
      setMessages((prev) => {
        // Deduplicate — if a message with same _id already exists skip it
        if (prev.some((m) => m._id?.toString() === message._id?.toString())) {
          return prev;
        }
        // Replace optimistic message if content and sender match within 2 seconds
        const optimisticIndex = prev.findIndex(
          (m) =>
            (m as any).isOptimistic === true &&
            m.senderId === message.senderId &&
            m.content === message.content
        );
        if (optimisticIndex !== -1) {
          const updated = [...prev];
          updated[optimisticIndex] = message;
          return updated;
        }
        return [...prev, message];
      });
      scrollToBottom();

      if (message.senderId === otherUser.userId) {
        fetch("/api/messages/markAsRead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partnerId: otherUser.userId }),
        }).catch((e) => console.warn("markAsRead error:", e));
      }
    };

    const handleUserTyping = (data: {
      senderId: string;
      isTyping: boolean;
    }) => {
      if (data.senderId === otherUser.userId) {
        setOtherUserTyping(data.isTyping);
      }
    };

    const handleReadReceipt = (data: {
      partnerId: string;
      lastReadAt: string;
    }) => {
      if (data.partnerId === otherUser.userId) {
        setOtherUserLastReadAt(new Date(data.lastReadAt));
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageConfirmed", handleNewMessage);
    socket.on("userTyping", handleUserTyping);
    socket.on("readReceipt", handleReadReceipt);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageConfirmed", handleNewMessage);
      socket.off("userTyping", handleUserTyping);
      socket.off("readReceipt", handleReadReceipt);
    };
  }, [socket, otherUser.userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      setImageUploading(true);
      toast.info("Uploading image...");

      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetch("/api/upload-chat-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.imageUrl) {
        throw new Error(uploadData.message || "Failed to upload image");
      }

      const message = await sendMessageToServer(
        otherUser.userId,
        "",
        uploadData.imageUrl
      );
      if (message) {
        setMessages((prev) => [...prev, message]);
        toast.success("Image sent successfully");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send image"
      );
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || connectionStatus !== "accepted" || !socket) return;

    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }

    const content = newMessage.trim();
    setNewMessage("");

    // Add optimistic message
    const tempMessage = {
      _id: `temp_${Date.now()}`,
      senderId: currentUser.userId,
      receiverId: otherUser.userId,
      content,
      createdAt: new Date(),
      isOptimistic: true,
      __v: 0,
    } as unknown as IMessage;

    setMessages((prev) => [...prev, tempMessage]);

    // Emit through socket — server will save and emit back via messageConfirmed
    socket.emit("sendMessage", {
      senderId: currentUser.userId,
      receiverId: otherUser.userId,
      content,
    });

    // Reset typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("typing", {
      senderId: currentUser.userId,
      receiverId: otherUser.userId,
      isTyping: false,
    });
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    if (socket) {
      socket.emit("typing", {
        senderId: currentUser.userId,
        receiverId: otherUser.userId,
        isTyping: true,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit("typing", {
          senderId: currentUser.userId,
          receiverId: otherUser.userId,
          isTyping: false,
        });
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-foreground">Loading...</div>
    );
  }

  if (connectionStatus !== "accepted") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-semibold mb-4">Cannot Send Messages</h2>
        <p className="text-muted-foreground text-center">
          You need to be connected with {otherUser.firstName} to send messages.
          {connectionStatus === "pending" &&
            " A connection request is pending."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center space-x-3 bg-card">
        <div className="h-10 w-10">
          <ProfilePhoto
            src={otherUser.profilePhoto}
            alt={otherUser.firstName}
          />
        </div>
        <div>
          <h2 className="font-semibold">{`${otherUser.firstName} ${otherUser.lastName}`}</h2>
          {otherUserTyping && (
            <p className="text-xs text-muted-foreground">typing...</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const messageKey = message._id
            ? message._id.toString()
            : `msg-${index}`;
          return (
            <div
              key={messageKey}
              className={`flex ${
                message.senderId === currentUser.userId
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === currentUser.userId
                    ? "bg-green-500 text-primary-foreground"
                    : "bg-blue-500 text-primary-foreground"
                } ${(message as any).isOptimistic ? "opacity-70" : ""}`}
              >
                {message.imageUrl &&
                  message.imageUrl !== "uploading..." && (
                    <div className="mb-2">
                      <Image
                        src={message.imageUrl}
                        alt="Shared content"
                        width={300}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}
                {message.content && (
                  <p className="whitespace-pre-wrap">
                    {convertUrlsToLinks(message.content)}
                  </p>
                )}
                <p className="text-xs mt-1 opacity-75">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {message.senderId === currentUser.userId &&
                  index === messages.length - 1 && (
                    <p className="text-[10px] text-white mt-1 text-right">
                      {otherUserLastReadAt &&
                      new Date(message.createdAt) <= otherUserLastReadAt
                        ? "Seen"
                        : "Sent"}
                    </p>
                  )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-border p-4 bg-card"
      >
        <div className="flex items-end space-x-2">
          <div className="relative flex-1">
            <Textarea
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="min-h-[60px] max-h-32 resize-none pr-12"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={imageUploading}
            />
            <label className="absolute right-2 bottom-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={imageUploading}
              />
              <Images
                className={`h-5 w-5 ${
                  imageUploading
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              />
            </label>
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || imageUploading}
          >
            {imageUploading ? "Uploading..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
