"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/providers/SocketProvider"; // <-- updated import
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { Images } from "lucide-react";
import { Button } from "./ui/button";

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
    memberIds
  }: {
    groupId: string;
    groupName: string;
    memberIds: string[];
  }) {
    const socket = useSocket();
    const { userId } = useAuth();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [imageUploading, setImageUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [members, setMembers] = useState<Record<string, MemberInfo>>({});
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (!groupId) {
        console.log('No groupId provided');
        return;
      }
      if (!socket) {
        console.log('Socket not available yet');
        return;
      }
      
      console.log('Joining group:', groupId);
      socket.emit("joinGroup", groupId);
  
      // Fetch messages with error handling
      const fetchMessages = async () => {
        console.log('Fetching messages for group:', groupId);
        try {
          const response = await fetch(`/api/groups/${groupId}/messages`);
          console.log('Response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch messages:', response.status, errorText);
            throw new Error(`Failed to fetch messages: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log('Raw messages from API:', JSON.stringify(data, null, 2));
          
          if (!Array.isArray(data)) {
            console.error('Expected array of messages but got:', typeof data);
            throw new Error('Invalid response format: expected array of messages');
          }
          
          // Ensure messages have the correct format
          const formattedMessages = data.map((msg: any) => {
            // Log each message for debugging
            console.log('Processing message:', msg._id, 'from', msg.senderId);
            return {
              ...msg,
              // Ensure dates are properly handled
              createdAt: new Date(msg.createdAt).toISOString()
            };
          });
          
          console.log('Setting messages:', formattedMessages.length, 'messages');
          setMessages(formattedMessages);
          
        } catch (error) {
          console.error('Error in fetchMessages:', error);
          // Optionally show an error message to the user
        }
      };
      
      fetchMessages();
  
      // Fetch user profiles for members from prop with error handling
      Promise.all(
        memberIds.map((id) =>
          fetch(`/api/users/${id}`)
            .then(async (res) => {
              if (!res.ok) {
                const error = await res.json();
                console.error(`Error fetching user ${id}:`, error);
                return { 
                  userId: id, 
                  firstName: 'Unknown', 
                  lastName: 'User',
                  profilePhoto: '/default-avatar.png'
                };
              }
              return res.json();
            })
            .catch(error => {
              console.error(`Failed to fetch user ${id}:`, error);
              return { 
                userId: id, 
                firstName: 'Unknown', 
                lastName: 'User',
                profilePhoto: '/default-avatar.png'
              };
            })
        )
      ).then((users: MemberInfo[]) => {
        const map: Record<string, MemberInfo> = {};
        users.forEach((u) => {
          if (u) { // Only add if user data exists
            map[u.userId] = u;
          }
        });
        setMembers(map);
        setIsLoadingMembers(false);
      });
  
      socket.on("newGroupMessage", (msg: GroupMessage) => {
        if (msg.groupId === groupId) {
          setMessages(prev => [...prev, msg]);
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
            setMembers(prev => ({ ...prev, [id]: userData }));
          } else {
            // Handle case where user fetch fails, maybe set a default
            setMembers(prev => ({ ...prev, [id]: { userId: id, firstName: 'Unknown', lastName: 'User' } }));
          }
        } catch (error) {
          console.error(`Failed to fetch user ${id}:`, error);
          setMembers(prev => ({ ...prev, [id]: { userId: id, firstName: 'Unknown', lastName: 'User' } }));
        }
      }
    };

    messages.forEach(msg => {
      if (msg.senderId !== userId) {
        fetchMemberInfo(msg.senderId);
      }
    });
  }, [messages, userId, members]);
  

  // Uploads a base64 image to our API endpoint which then uploads to Cloudinary
  const uploadChatImage = async (base64Image: string): Promise<string> => {
    try {
      const response = await fetch('/api/upload-chat-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload image');
      }

      if (!data.success || !data.imageUrl) {
        throw new Error('Invalid response from server');
      }

      return data.imageUrl;
    } catch (error) {
      console.error('Error in uploadChatImage:', error);
      toast.error('Failed to upload image. Please try again.');
      throw error;
    }
  };

  // Handle image file selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`Image must be smaller than 5MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    try {
      setImageUploading(true);
      
      // Read the file as base64
      const reader = new FileReader();
      
      return new Promise<void>((resolve) => {
        reader.onload = (event) => {
          try {
            const base64Image = event.target?.result as string;
            // Validate the image data
            if (!base64Image || !base64Image.startsWith('data:image/')) {
              throw new Error('Invalid image data');
            }
            
            setSelectedImage(base64Image);
            resolve();
          } catch (error) {
            console.error('Error processing image:', error);
            toast.error('Failed to process image. Please try another file.');
            throw error;
          } finally {
            setImageUploading(false);
          }
        };
        
        reader.onerror = () => {
          console.error('Error reading file');
          toast.error('Error reading file. Please try again.');
          setImageUploading(false);
          resolve();
        };
        
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error in handleImageChange:', error);
      toast.error('An error occurred while processing the image');
      setImageUploading(false);
    }
  };

  const sendMessage = async () => {
    // Don't send empty messages with no image
    if (!newMessage.trim() && !selectedImage) return;
    
    try {
      setIsSending(true);
      const messageToSend = newMessage.trim();
      
      // Upload image if selected
      let imageUrl = null;
      if (selectedImage) {
        try {
          imageUrl = await uploadChatImage(selectedImage);
        } catch (error) {
          console.error('Image upload failed:', error);
          toast.error('Failed to upload image. Message not sent.');
          return; // Don't send message if image upload fails
        }
      }
      
      // Only send if we have content or an image
      if (messageToSend || imageUrl) {
        // Emit the message with both text and image
        socket?.emit("sendGroupMessage", {
          groupId,
          senderId: userId,
          content: messageToSend,
          imageUrl: imageUrl || undefined,
        });
        
        // Reset form
        setNewMessage("");
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error("Error in sendMessage:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === userId) return "You";
    const member = members[senderId];
    if (member) return `${member.firstName} ${member.lastName}`;
    return senderId; // fallback
  };

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
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isCurrentUser ? 'ml-auto' : ''}`}>
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
                            ? 'bg-green-100 text-green-900 rounded-tr-none' 
                            : 'bg-blue-100 text-blue-900 rounded-tl-none'
                        }`}
                      >
                        {convertUrlsToLinks(m.content)}
                      </div>
                    )}
                    {m.imageUrl && (
                      <div className={`mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block max-w-full ${isCurrentUser ? 'ml-auto' : ''}`}>
                          <Image 
                            src={m.imageUrl} 
                            alt="Chat attachment"
                            width={200}
                            height={200}
                            className="rounded-lg max-w-full h-auto"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
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
              <Images className={`h-5 w-5 ${imageUploading ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'}`} />
            </label>
          </div>
          <Button 
            onClick={sendMessage} 
            disabled={(!newMessage.trim() && !selectedImage) || imageUploading || isSending}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg min-w-[80px] flex items-center justify-center"
          >
            {(imageUploading || isSending) ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {imageUploading ? 'Uploading...' : 'Sending...'}
              </span>
            ) : (
              'Send'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
