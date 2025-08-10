"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import mongoose from "mongoose";
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
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const { socket, isConnected } = useSocket();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [otherUserLastReadAt, setOtherUserLastReadAt] = useState<Date | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load initial messages and connection status
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [status, { messages: initialMessages }] = await Promise.all([
          getConnectionStatus(otherUser.userId),
          fetch(`/api/messages?receiverId=${otherUser.userId}`).then(res => res.json())
        ]);
  
        setConnectionStatus(status);
        if (Array.isArray(initialMessages)) {
          setMessages(initialMessages);
        }
        // Fetch the other user's last read time
        try {
          const res = await fetch(`/api/messages/readStatus?partnerId=${otherUser.userId}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.lastReadAt) {
              setOtherUserLastReadAt(new Date(data.lastReadAt));
            }
          }
        } catch (err) {
          console.warn("Failed to fetch other user's last read time:", err);
        }
        // Mark conversation as read on load
        try {
          await fetch("/api/messages/markAsRead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partnerId: otherUser.userId })
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
  

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: IMessage) => {
      setMessages(prev => {
        if (prev.some(m => m._id === message._id || 
            (m.senderId === message.senderId && 
             m.content === message.content && 
             new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime() < 1000))) {
          return prev;
        }
        return [...prev, message];
      });
    
      scrollToBottom();
      // If the incoming message is from the other user, mark conversation as read
      if (message.senderId === otherUser.userId) {
        fetch("/api/messages/markAsRead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partnerId: otherUser.userId })
        }).catch(e => console.warn("markAsRead error:", e));
    }

    };

    
    
    const handleUserTyping = (data: { senderId: string; isTyping: boolean }) => {
      if (data.senderId === otherUser.userId) {
        setOtherUserTyping(data.isTyping);
      }
    };
    
    // ✅ Listen for read receipts
    const handleReadReceipt = (data: { partnerId: string; lastReadAt: string }) => {
      if (data.partnerId === otherUser.userId) {
        setOtherUserLastReadAt(new Date(data.lastReadAt));
      }
    };
    socket.on('readReceipt', handleReadReceipt);


    socket.on('newMessage', handleNewMessage);
    socket.on('messageConfirmed', handleNewMessage);
    socket.on('userTyping', handleUserTyping);
    
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageConfirmed', handleNewMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('readReceipt', handleReadReceipt); 
    };
  }, [socket, otherUser.userId]);

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

  const sendMessage = async (receiverId: string, content: string, imageUrl?: string): Promise<IMessage | null> => {
    const tempId = new mongoose.Types.ObjectId().toString();
    const tempMessage: IMessage = {
      _id: tempId,
      senderId: currentUser.userId,
      receiverId,
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      __v: 0
    } as unknown as IMessage;

    try {

      // Optimistic update
      setMessages(prev => [...prev, tempMessage]);
      
      const response = await sendMessageToServer(receiverId, content, imageUrl);
      
      // Update the message with server response
      if (response) {
        setMessages(prev => 
          prev.map(m => m._id === tempId ? response : m)
        );
      }
      
      return response;
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(m => m._id !== tempId));
      toast.error("Failed to send message");
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageUploading) || connectionStatus !== 'accepted' || !socket) return;

    try {
      // Create a temporary message ID for optimistic update
      const tempId = new mongoose.Types.ObjectId().toString();
      
      // Create a temporary message that matches IMessage
      const tempMessage = {
        _id: tempId,
        senderId: currentUser.userId,
        receiverId: otherUser.userId,
        content: newMessage,
        imageUrl: imageUploading ? 'uploading...' : undefined,
        createdAt: new Date(),
        // Add any other required fields from IMessage
        __v: 0,
        $isNew: true,
        $locals: {},
        $op: null,
        $where: null,
      } as unknown as IMessage;
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");
      
      // Emit message through socket
      socket.emit('sendMessage', {
        senderId: currentUser.userId,
        receiverId: otherUser.userId,
        content: newMessage,
        imageUrl: imageUploading ? 'uploading...' : undefined
      });

      // Reset typing indicator
      setIsTyping(false);
      if (socket) {
        socket.emit('typing', {
          senderId: currentUser.userId,
          receiverId: otherUser.userId,
          isTyping: false
        });
      }
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      if (socket) {
        socket.emit('typing', {
          senderId: currentUser.userId,
          receiverId: otherUser.userId,
          isTyping: true
        });
      }
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set a timeout to reset typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('typing', {
          senderId: currentUser.userId,
          receiverId: otherUser.userId,
          isTyping: false
        });
      }
    }, 2000);
  };

  if (loading) {
    return <div className="text-center py-4 text-foreground">Loading...</div>;
  }

    if (connectionStatus !== 'accepted') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-xl font-semibold mb-4">Cannot Send Messages</h2>
        <p className="text-muted-foreground text-center">
          You need to be connected with {otherUser.firstName} to send messages.
          {connectionStatus === 'pending' && " A connection request is pending."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center space-x-3 bg-card">
        <div className="h-10 w-10">
          <ProfilePhoto src={otherUser.profilePhoto} alt={otherUser.firstName} />
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
          // Ensure message._id is always a string for the key
          const messageKey = message._id ? message._id.toString() : `msg-${index}`;
          
          return (
            <div
              key={messageKey}
              className={`flex ${
                message.senderId === currentUser.userId ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderId === currentUser.userId
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.imageUrl && message.imageUrl !== 'uploading...' && (
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
                {message.imageUrl === 'uploading...' && (
                  <div className="mb-2 p-4 bg-muted rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {message.content && (
                  <p className="whitespace-pre-wrap">
                    {convertUrlsToLinks(message.content)}
                  </p>
                )}
                <p className="text-xs mt-1 opacity-75">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {message.senderId === currentUser.userId && index === messages.length - 1 && (
                <p className="text-[10px] text-gray-400 mt-1 text-right">
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
      <form onSubmit={handleSendMessage} className="border-t border-border p-4 bg-card">
        <div className="flex items-end space-x-2">
          <div className="relative flex-1">
            <Textarea
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="min-h-[60px] max-h-32 resize-none pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
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
              <Images className={`h-5 w-5 ${imageUploading ? 'text-muted-foreground/50' : 'text-muted-foreground hover:text-foreground'}`} />
            </label>
          </div>
          <Button 
            type="submit" 
            disabled={(!newMessage.trim() && !imageUploading) || connectionStatus !== 'accepted'}
          >
            {imageUploading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Uploads a base64 image to Cloudinary and returns the image URL
const uploadChatImage = async (base64Image: string): Promise<string> => {
  try {
    const response = await fetch("/api/upload-chat-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload image");
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
