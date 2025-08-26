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

interface MessagesListProps {
  currentUser: {
    id: string;
    [key: string]: any;
  };
}

export default function MessagesList({ currentUser }: MessagesListProps) {
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
          if (item && item.userId) {
            newLastMap[item.userId] = {
              time: item.lastMessageDate ? new Date(item.lastMessageDate).getTime() : 0,
              content: item.lastMessageContent ?? null,
              imageUrl: item.lastMessageImage ?? null,
              isUnread: !!item.isUnread
            };
          }
        });
        
        setLastMap(newLastMap);
        setUsers(connectedUsers || []);

        const validRequests: ConnectionRequest[] = (requests || [])
          .filter((req: any): req is NonNullable<typeof req> => req !== null)
          .map((req: any) => ({
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
    const interval = setInterval(fetchData, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handler = (msg: any) => {
      if (!msg) return;
      
      const partnerId = msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;
      if (!partnerId) return;
      
      setUsers(prev => {
        const userIndex = prev.findIndex(u => u.userId === partnerId);
        if (userIndex === -1) return prev;
        
        const updatedUsers = [...prev];
        const [user] = updatedUsers.splice(userIndex, 1);
        return [user, ...updatedUsers];
      });
      
      setLastMap(prev => ({
        ...prev,
        [partnerId]: {
          time: Date.now(),
          content: msg.content ?? null,
          imageUrl: msg.imageUrl ?? null,
          isUnread: msg.senderId !== currentUser?.id
        }
      }));
    };
    
    socket.on("newMessage", handler);
    return () => {
      socket.off("newMessage", handler);
    };
  }, [socket, currentUser?.id]);

  const handleConnectionResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
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
        setUsers(connectedUsers || []);
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
            <div className="h-12 w-12 rounded-full bg-muted"></div>
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
      {/* Search and Tabs */}
      <div className="p-3 sm:p-4 border-b border-border space-y-3">
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

      {/* Connection Requests */}
      {connectionRequests.length > 0 && (
        <div className="p-3 sm:p-4 bg-muted/50 border-b border-border">
          <h2 className="font-semibold text-sm sm:text-base mb-3">Connection Requests</h2>
          <div className="space-y-3">
            {connectionRequests.map((request) => {
              const isProcessing = processingRequests[request._id];
              return (
                <div
                  key={request._id}
                  className="bg-card text-card-foreground p-3 sm:p-4 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ProfilePhoto 
                      src={request.sender?.profilePhoto || "/default-avatar.png"} 
                      className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm sm:text-base truncate">
                        {request.sender?.firstName} {request.sender?.lastName}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Wants to connect with you
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none sm:px-4"
                      disabled={isProcessing}
                      onClick={() => handleConnectionResponse(request._id, 'rejected')}
                    >
                      {isProcessing ? '...' : 'Decline'}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none sm:px-4"
                      disabled={isProcessing}
                      onClick={() => handleConnectionResponse(request._id, 'accepted')}
                    >
                      {isProcessing ? '...' : 'Accept'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages/Groups List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'groups' ? (
          <GroupsList 
            groups={filteredGroups} 
            searchTerm={searchTerm} 
            onGroupCreated={() => window.location.reload()} 
          />
        ) : (
          <DirectMessagesList 
            users={filteredUsers} 
            lastMap={lastMap} 
            searchTerm={searchTerm} 
          />
        )}
      </div>
    </div>
  );
}

// Sub-components for better organization

interface GroupsListProps {
  groups: Group[];
  searchTerm: string;
  onGroupCreated: () => void;
}

function GroupsList({ groups, searchTerm, onGroupCreated }: GroupsListProps) {
  return (
    <div className="p-2 sm:p-4">
      <div className="flex justify-between items-center mb-3 px-2 sm:px-0">
        <h2 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
          Groups
        </h2>
        <CreateGroupModal onGroupCreated={onGroupCreated}>
          <Button size="sm" className="h-8 text-xs sm:text-sm">
            New Group
          </Button>
        </CreateGroupModal>
      </div>
      
      {groups.length > 0 ? (
        <div className="space-y-1">
          {groups.map((group) => (
            <Link
              key={group._id}
              href={`/messages/group/${group._id}`}
              className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <ProfilePhoto 
                src={group.imageUrl || "/default-group.png"} 
                className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-medium text-sm sm:text-base truncate">
                  {group.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={<Users className="w-full h-full opacity-50" />}
          title="No groups yet"
          description={searchTerm ? "No groups match your search" : "Create a group to start chatting"}
        />
      )}
    </div>
  );
}

interface DirectMessagesListProps {
  users: IUser[];
  lastMap: Record<string, { time: number; content?: string | null; imageUrl?: string | null; isUnread?: boolean }>;
  searchTerm: string;
}

function DirectMessagesList({ users, lastMap, searchTerm }: DirectMessagesListProps) {
  return (
    <div className="p-2 sm:p-4">
      <h2 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider mb-3 px-2 sm:px-0">
        Direct Messages
      </h2>
      
      {users.length > 0 ? (
        <div className="space-y-1">
          {users.map((user) => (
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
                    ? lastMap[user.userId]!.content!.length > 40
                      ? lastMap[user.userId]!.content!.substring(0, 40) + '...'
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
        <EmptyState 
          icon={<MessageSquare className="w-full h-full opacity-50" />}
          title={searchTerm ? "No matches found" : "No conversations yet"}
          description={searchTerm 
            ? "Try a different search term" 
            : "Connect with other users to start chatting"}
        />
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-8 px-4">
      <div className="mx-auto h-16 w-16 text-muted-foreground mb-3">
        {icon}
      </div>
      <p className="font-medium text-muted-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
