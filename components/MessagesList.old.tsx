"use client";

import { useEffect, useState } from "react";
import { getConnectedUsers, getConnectionRequests, respondToConnectionRequest, getLastMessageTimesForCurrentUser } from "@/lib/serveractions";
import { IUser } from "@/models/user.model";
import ProfilePhoto from "./shared/ProfilePhoto";
import Link from "next/link";
import { Button } from "./ui/button";
import { SearchIcon, MessageSquare, Users } from "lucide-react";
import { Input } from "./ui/input";
import { toast } from "react-toastify";
import { useSocket } from "@/contexts/SocketContext";
import CreateGroupModal from "@/components/CreateGroupModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "./OfflineIndicator";

interface ConnectionRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  sender: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto: string;
    description: string;
    graduationYear: number | null;
  };
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface Group {
  _id: string;
  name: string;
  imageUrl?: string;
  members: string[];
  createdBy: string;
}

type MessageTab = 'dms' | 'groups';

export default function MessagesList({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<MessageTab>('dms');
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  const { socket } = useSocket();
  const isOnline = useOnlineStatus();

  const [lastMap, setLastMap] = useState<
    Record<string, { time: number; content?: string | null; imageUrl?: string | null; isUnread?: boolean }>
  >({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [connectedUsers, requests, groupsRes] = await Promise.all([
          getConnectedUsers(),
          getConnectionRequests(),
          fetch("/api/groups").then(res => res.json())
        ]);

        setGroups(groupsRes);

        const lastTimes = await getLastMessageTimesForCurrentUser();

        const newLastMap: Record<string, { time: number; content?: string | null; imageUrl?: string | null; isUnread?: boolean }> = {};
        lastTimes.forEach((item: any) => {
          newLastMap[item.userId] = {
            time: item.lastMessageDate ? new Date(item.lastMessageDate).getTime() : 0,
            content: item.lastMessageContent ?? null,
            imageUrl: item.lastMessageImage ?? null,
            isUnread: !!item.isUnread
          };
        });
        setLastMap(newLastMap);

        const sorted = [...connectedUsers].sort((a: any, b: any) => {
          const ta = newLastMap[a.userId]?.time || 0;
          const tb = newLastMap[b.userId]?.time || 0;
          return tb - ta;
        });
        setUsers(sorted);

        const validRequests: ConnectionRequest[] = requests
          .filter((req): req is NonNullable<typeof req> => req !== null)
          .map(req => ({
            _id: req._id.toString(),
            senderId: req.senderId,
            receiverId: req.receiverId,
            sender: req.sender,
            status: req.status,
            createdAt: req.createdAt,
            updatedAt: req.updatedAt
          }));
        setConnectionRequests(validRequests);

      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg: any) => {
      const partnerId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
      setUsers(prev => {
        const i = prev.findIndex(u => u.userId === partnerId);
        if (i === -1) return prev;
        const cloned = [...prev];
        const [item] = cloned.splice(i, 1);
        cloned.unshift(item);
        return cloned;
      });
      setLastMap(prev => ({
        ...prev,
        [partnerId]: {
          time: Date.now(),
          content: msg.content ?? null,
          imageUrl: msg.imageUrl ?? null,
          isUnread: msg.senderId !== currentUser.id
        }
      }));
    };
    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [socket, currentUser]);

  const handleConnectionResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    // Check if user is online
    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }
    
    try {
      setProcessingRequests(prev => ({ ...prev, [connectionId]: true }));
      await respondToConnectionRequest(connectionId, status);
      setConnectionRequests(prev => prev.filter(req => req._id !== connectionId));

      if (status === 'accepted') {
        const connectedUsers = await getConnectedUsers();
        const lastTimes = await getLastMessageTimesForCurrentUser();
        const newLastMap: Record<string, number> = {};
        lastTimes.forEach((item: any) => {
          newLastMap[item.userId] = new Date(item.lastMessageDate).getTime();
        });
        const sorted = [...connectedUsers].sort((a: any, b: any) => {
          const ta = newLastMap[a.userId] || 0;
          const tb = newLastMap[b.userId] || 0;
          return tb - ta;
        });
        setUsers(sorted);
        toast.success("Connection accepted!");
      } else {
        toast.info("Connection request declined");
      }
    } catch (error) {
      console.error('Error handling connection response:', error);
      toast.error("Failed to respond to connection request");
    } finally {
      setProcessingRequests(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const filteredUsers = users.filter((user) =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-3 w-1/2 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 sm:p-4 border-b border-border space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab === 'dms' ? 'messages' : 'groups'}`}
            className="pl-9 h-10 sm:h-9 text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value: string) => setActiveTab(value as MessageTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-10 sm:h-9">
            <TabsTrigger value="dms" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">Groups</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {connectionRequests.length > 0 && (
        <div className="p-3 sm:p-4 bg-muted/50 border-b border-border">
          <h2 className="font-semibold text-sm sm:text-base mb-3">Connection Requests</h2>
          <div className="space-y-3">
            {connectionRequests.map((request) => {
              const isProcessing = processingRequests[request._id];
                    <ProfilePhoto 
                      src={group.imageUrl || "/default-group.png"} 
                      className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">{group.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <div className="mx-auto h-16 w-16 text-muted-foreground mb-3">
                  <Users className="w-full h-full opacity-50" />
                </div>
                <p className="font-medium text-muted-foreground">No groups yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create a group to start chatting</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="px-2 sm:px-0">
              <h2 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-3">Direct Messages</h2>
              {filteredUsers.length > 0 ? (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <Link
                      key={user.userId}
                      href={`/messages/${user.userId}`}
                      className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="relative">
                        <ProfilePhoto 
                          src={user.profilePhoto || "/default-avatar.png"} 
                          className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0"
                        />
                        {lastMap[user.userId]?.isUnread && (
                          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium text-sm sm:text-base truncate">
                            {user.firstName} {user.lastName}
                          </h3>
                          {lastMap[user.userId]?.time && (
                            <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(lastMap[user.userId].time).toLocaleTimeString([], { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </div>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                          {lastMap[user.userId]?.content
                            ? lastMap[user.userId]!.content.length > 40
                              ? lastMap[user.userId]!.content.substring(0, 40) + '...'
                              : lastMap[user.userId]!.content
                            : lastMap[user.userId]?.imageUrl
                              ? <span className="inline-flex items-center gap-1"><span className="text-xs">📷</span> Photo</span>
                              : <span className="text-muted-foreground/80">Start a conversation</span>}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="mx-auto h-16 w-16 text-muted-foreground mb-3">
                    <MessageSquare className="w-full h-full opacity-50" />
                  </div>
                  <p className="font-medium text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Connect with other users to start chatting</p>
                </div>
              )}
            </>
                <p className="font-medium text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-1">Connect with other users to start chatting</p>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
