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
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${activeTab === 'dms' ? 'messages' : 'groups'}`}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={(value: string) => setActiveTab(value as MessageTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Direct Messages
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {connectionRequests.length > 0 && (
        <div className="p-4 bg-muted/50">
          <h2 className="font-semibold mb-4">Connection Requests</h2>
          <div className="space-y-4">
            {connectionRequests.map((request) => {
              const isProcessing = processingRequests[request._id];
              return (
                <div
                  key={request._id}
                  className="bg-card text-card-foreground p-4 rounded-lg border border-border flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <ProfilePhoto src={request.sender?.profilePhoto || "/default-avatar.png"} />
                    <div>
                      <h3 className="font-medium">
                        {request.sender?.firstName} {request.sender?.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Wants to connect with you
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleConnectionResponse(request._id, 'rejected')}
                    >
                      {isProcessing ? 'Processing...' : 'Decline'}
                    </Button>
                    <Button
                      size="sm"
                      disabled={isProcessing}
                      onClick={() => handleConnectionResponse(request._id, 'accepted')}
                    >
                      {isProcessing ? 'Processing...' : 'Accept'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {activeTab === 'groups' ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-sm text-gray-500">Groups</h2>
                <CreateGroupModal onGroupCreated={() => window.location.reload()} />
              </div>
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <Link
                    key={group._id}
                    href={`/messages/group/${group._id}`}
                    className="flex items-center space-x-4 p-4 hover:bg-accent/50 rounded-lg transition-colors"
                  >
                    <ProfilePhoto src={group.imageUrl || "/default-group.png"} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{group.name}</h3>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No groups found</p>
                  <p className="text-sm mt-2">Create a group to get started</p>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="font-semibold text-sm text-gray-500 mb-4">Direct Messages</h2>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                <Link
                  key={user.userId}
                  href={`/messages/${user.userId}`}
                  className="flex items-center space-x-4 p-4 hover:bg-accent/50 rounded-lg transition-colors"
                >
                  <ProfilePhoto src={user.profilePhoto || "/default-avatar.png"} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      {lastMap[user.userId]?.time && (
                        <div className="text-xs text-muted-foreground ml-2">
                          {new Date(lastMap[user.userId].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {lastMap[user.userId]?.isUnread && (
                        <span className="inline-flex items-center justify-center bg-green-500 text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {lastMap[user.userId]?.content
                        ? lastMap[user.userId]!.content
                        : lastMap[user.userId]?.imageUrl
                          ? "📷 Photo"
                          : "Click to view chat"}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No conversations found</p>
                <p className="text-sm mt-2">Connect with other users to start chatting</p>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
