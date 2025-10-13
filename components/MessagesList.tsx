"use client";

import { useEffect, useState } from "react";
import { getConnectedUsers, getConnectionRequests, respondToConnectionRequest } from "@/lib/serveractions";
import { IUser } from "@/models/user.model";
import ProfilePhoto from "./shared/ProfilePhoto";
import Link from "next/link";
import { Button } from "./ui/button";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import { toast } from "react-toastify";

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

export default function MessagesList({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [connectedUsers, requests] = await Promise.all([
          getConnectedUsers(),
          getConnectionRequests()
        ]);
        setUsers(connectedUsers);
        // Convert the mongoose documents to our ConnectionRequest type
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
    // Poll for new requests every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleConnectionResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      setProcessingRequests(prev => ({ ...prev, [connectionId]: true }));
      await respondToConnectionRequest(connectionId, status);
      
      // Remove the request from the list
      setConnectionRequests(prev => prev.filter(req => req._id !== connectionId));
      
      if (status === 'accepted') {
        // Refresh connected users list
        const connectedUsers = await getConnectedUsers();
        setUsers(connectedUsers);
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
    `${user.firstName} ${user.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
                    <ProfilePhoto
                      src={request.sender?.profilePhoto || "/default-avatar.png"}
                    />
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
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No messages yet. Connect with people to start chatting!
            </p>
          ) : (
            filteredUsers.map((user) => (
              <Link
                key={user.userId}
                href={`/messages/${user.userId}`}
                className="flex items-center space-x-4 p-4 hover:bg-accent/50 rounded-lg transition-colors"
              >
                <ProfilePhoto
                  src={user.profilePhoto || "/default-avatar.png"}
                />
                <div>
                  <h3 className="font-medium">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">Click to view chat</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 