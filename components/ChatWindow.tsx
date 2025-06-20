"use client";

import { useEffect, useState, useRef } from "react";
import { IMessage } from "@/models/message.model";
import { IUser } from "@/models/user.model";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { getConnectionStatus, getMessages, sendMessage } from "@/lib/serveractions";
import { toast } from "react-toastify";

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
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [otherUser.userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
              key={message._id}
              className={`flex ${
                message.senderId === currentUser.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === currentUser.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                <p>{message.content}</p>
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
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            rows={1}
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
} 