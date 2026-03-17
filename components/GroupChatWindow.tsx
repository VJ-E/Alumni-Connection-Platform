"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/contexts/SocketContext";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { Images } from "lucide-react";
import { Button } from "./ui/button";
import { useOnlineStatus } from "./OfflineIndicator";

interface GroupMessage {
  _id: string;
  groupId: string;
  senderId: string;
  content?: string;
  imageUrl?: string;
  createdAt: string;
}

interface MemberInfo {
  userId: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

export default function GroupChatWindow({
  groupId,
  groupName,
  memberIds,
}: {
  groupId: string;
  groupName: string;
  memberIds: string[];
}) {
  const { socket } = useSocket();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, MemberInfo>>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!groupId || !socket) return;

    socket.emit("joinGroup", groupId);

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/groups/${groupId}/messages`);
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid response format");
        setMessages(
          data.map((msg: any) => ({
            ...msg,
            createdAt: new Date(msg.createdAt).toISOString(),
          }))
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    Promise.all(
      memberIds.map((id) =>
        fetch(`/api/users/${id}`)
          .then(async (res) => {
            if (!res.ok) return { userId: id, firstName: "Unknown", lastName: "User" };
            return res.json();
          })
          .catch(() => ({ userId: id, firstName: "Unknown", lastName: "User" }))
      )
    ).then((users: MemberInfo[]) => {
      const map: Record<string, MemberInfo> = {};
      users.forEach((u) => { if (u) map[u.userId] = u; });
      setMembers(map);
      setIsLoadingMembers(false);
    });

    socket.on("newGroupMessage", (msg: GroupMessage) => {
      if (msg.groupId === groupId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      socket.emit("leaveGroup", groupId);
      socket.off("newGroupMessage");
    };
  }, [groupId, socket, memberIds]);

  useEffect(() => {
    const fetchMemberInfo = async (id: string) => {
      if (!members[id]) {
        try {
          const res = await fetch(`/api/users/${id}`);
          if (res.ok) {
            const userData = await res.json();
            setMembers((prev) => ({ ...prev, [id]: userData }));
          } else {
            setMembers((prev) => ({
              ...prev,
              [id]: { userId: id, firstName: "Unknown", lastName: "User" },
            }));
          }
        } catch (error) {
          setMembers((prev) => ({
            ...prev,
            [id]: { userId: id, firstName: "Unknown", lastName: "User" },
          }));
        }
      }
    };

    messages.forEach((msg) => {
      if (msg.senderId !== userId) {
        fetchMemberInfo(msg.senderId);
      }
    });
  }, [messages, userId, members]);

  const uploadChatImage = async (base64Image: string): Promise<string> => {
    const response = await fetch("/api/upload-chat-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });
    const data = await response.json();
    if (!response.ok || !data.success || !data.imageUrl) {
      throw new Error(data.message || "Failed to upload image");
    }
    return data.imageUrl;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result as string;
      if (!base64Image || !base64Image.startsWith("data:image/")) {
        toast.error("Invalid image data");
        setImageUploading(false);
        return;
      }
      setSelectedImage(base64Image);
      setImageUploading(false);
    };
    reader.onerror = () => {
      toast.error("Error reading file");
      setImageUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;
    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }

    try {
      setIsSending(true);
      const messageToSend = newMessage.trim();

      let imageUrl = null;
      if (selectedImage) {
        try {
          imageUrl = await uploadChatImage(selectedImage);
        } catch (error) {
          toast.error("Failed to upload image. Message not sent.");
          return;
        }
      }

      if (messageToSend || imageUrl) {
        socket?.emit("sendGroupMessage", {
          groupId,
          senderId: userId,
          content: messageToSend,
          imageUrl: imageUrl || undefined,
        });
        setNewMessage("");
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === userId) return "You";
    const member = members[senderId];
    if (member) return `${member.firstName} ${member.lastName}`;
    return senderId;
  };

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
            className="text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">{groupName}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMembers ? (
          <div className="text-center p-4">Loading member info...</div>
        ) : (
          messages.map((m) => {
            const isCurrentUser = m.senderId === userId;
            return (
              <div
                key={m._id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] ${isCurrentUser ? "ml-auto" : ""}`}>
                  {!isCurrentUser && (
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {getSenderName(m.senderId)}
                    </p>
                  )}
                  <div className="space-y-1">
                    {m.content && (
                      <div
                        className={`inline-block p-3 rounded-lg ${
                          isCurrentUser
                            ? "bg-green-100 text-green-900 rounded-tr-none"
                            : "bg-blue-100 text-blue-900 rounded-tl-none"
                        }`}
                      >
                        {convertUrlsToLinks(m.content)}
                      </div>
                    )}
                    {m.imageUrl && (
                      <div className={`mt-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                        <div className={`inline-block max-w-full ${isCurrentUser ? "ml-auto" : ""}`}>
                          <Image
                            src={m.imageUrl}
                            alt="Chat attachment"
                            width={200}
                            height={200}
                            className="rounded-lg max-w-full h-auto"
                            style={{ maxHeight: "300px", objectFit: "contain" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview */}
      {selectedImage && (
        <div className="relative p-2 bg-gray-100 border-t">
          <div className="relative w-32 h-32">
            <Image
              src={selectedImage}
              alt="Preview"
              fill
              className="object-cover rounded"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[120px] resize-none pr-10"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <label className="absolute right-2 bottom-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                ref={fileInputRef}
                disabled={imageUploading}
              />
              <Images
                className={`h-5 w-5 ${
                  imageUploading ? "text-gray-400" : "text-gray-500 hover:text-gray-700"
                }`}
              />
            </label>
          </div>
          <Button
            onClick={sendMessage}
            disabled={
              (!newMessage.trim() && !selectedImage) || imageUploading || isSending
            }
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg min-w-[80px]"
          >
            {imageUploading || isSending ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {imageUploading ? "Uploading..." : "Sending..."}
              </span>
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
