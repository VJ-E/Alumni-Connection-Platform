"use client";

import { useEffect, useState } from "react";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Button } from "./ui/button";
import { getAllUsers, sendConnectionRequest, getConnectionStatus } from "@/lib/serveractions";
import { IUser, Department } from "@/models/user.model";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import { toast } from "react-toastify";
import { Badge } from "./ui/badge";
import { useOnlineStatus } from "./OfflineIndicator";

type UserType = 'all' | 'student' | 'alumni' | 'admin';

export default function PeopleList({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [processingConnections, setProcessingConnections] = useState<Record<string, boolean>>({});
  const [selectedTab, setSelectedTab] = useState<UserType>('all');
  const isOnline = useOnlineStatus();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const allUsers = await getAllUsers();
        // Filter out the current user and ensure proper typing
        const otherUsers = allUsers
          .filter((user) => user.userId !== currentUser?.id)
          .map(user => ({
            ...user,
            department: user.department as Department
          }));
          
        setUsers(otherUsers as IUser[]);

        // Fetch connection status for each user
        const statuses: Record<string, string> = {};
        await Promise.all(
          otherUsers.map(async (user) => {
            const status = await getConnectionStatus(user.userId);
            if (status) statuses[user.userId] = status;
          })
        );
        setConnectionStatuses(statuses);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [currentUser?.id]);

  const handleConnect = async (userId: string) => {
    // Check if user is online
    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }
    
    setProcessingConnections(prev => ({ ...prev, [userId]: true }));
    try {
      await sendConnectionRequest(userId);
      setConnectionStatuses(prev => ({ ...prev, [userId]: "pending" }));
      toast.success("Connection request sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send connection request");
    } finally {
      setProcessingConnections(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getConnectionButton = (userId: string) => {
    const status = connectionStatuses[userId];
    const isProcessing = processingConnections[userId];

    if (isProcessing) {
      return (
        <Button disabled className="w-full">
          Processing...
        </Button>
      );
    }

    switch (status) {
      case "pending":
        return (
          <Button variant="outline" disabled className="w-full">
            Pending
          </Button>
        );
      case "accepted":
        return (
          <Link href={`/messages/${userId}`} className="w-full">
            <Button className="w-full">Message</Button>
          </Link>
        );
      case "rejected":
        return (
          <Button variant="outline" disabled className="w-full">
            Connection Declined
          </Button>
        );
      default:
        return (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleConnect(userId)}
          >
            Connect
          </Button>
        );
    }
  };

  const currentYear = new Date().getFullYear();

  const filteredUsers = users.filter((user) => {
    const nameMatches = `${user.firstName} ${user.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!nameMatches) return false;

    // Make sure graduationYear exists and is a number
    const graduationYear = user.graduationYear ? Number(user.graduationYear) : null;

    switch (selectedTab) {
      case 'student':
        return graduationYear !== null && graduationYear > currentYear;
      case 'alumni':
        return graduationYear !== null && graduationYear <= currentYear;
      case 'admin':
        return user.role === 'admin';
      default:
        return true;
    }
  });

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  const tabs = [
    { id: 'all' as const, label: 'All', count: users.length },
    { 
      id: 'student' as const, 
      label: 'Students', 
      count: users.filter(u => u.graduationYear && u.graduationYear > currentYear).length 
    },
    { 
      id: 'alumni' as const, 
      label: 'Alumni', 
      count: users.filter(u => u.graduationYear && u.graduationYear <= currentYear).length 
    },
  ];

  return (
    <div className="pb-4">
      <div className="sticky top-[4rem] z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="p-2 sm:p-4">
          <div className="relative mb-2 sm:mb-3">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              className="pl-10 bg-background w-full text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <div className="flex overflow-x-auto no-scrollbar pb-1 -mx-1">
              <div className="flex flex-nowrap gap-1.5 sm:gap-2 px-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap rounded-full transition-colors flex items-center gap-1.5
                      ${selectedTab === tab.id 
                        ? 'bg-accent text-accent-foreground font-medium' 
                        : 'text-foreground/80 hover:bg-accent/50 hover:text-foreground'}`}
                  >
                    {tab.label}
                    <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-5 text-xs rounded-full ${
                      selectedTab === tab.id ? 'bg-accent-foreground/20' : 'bg-muted'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Gradient fade effect for the right edge */}
            {/* <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 pointer-events-none" style={{
              background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 80%)'
            }} /> */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-2 sm:p-4">
        {filteredUsers.map((user) => {
          const graduationYear = user.graduationYear ? Number(user.graduationYear) : null;
          const isAlumni = graduationYear !== null && graduationYear <= currentYear;
          
          return (
            <div
              key={user.userId}
              className="bg-card text-card-foreground p-4 sm:p-6 rounded-lg border border-border flex flex-col items-center hover:shadow-md transition-shadow"
            >
              {/* <ProfilePhoto src={user.profilePhoto || "/default-avatar.png"} /> */}
              <ProfilePhoto src={user.profilePhoto} userId={user.userId} />
              <h2 className="mt-4 font-semibold text-lg text-foreground">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={user.role === 'admin' ? "default" : isAlumni ? "default" : "secondary"}>
                  {user?.role === 'admin' ? 'Admin' : isAlumni ? 'Alumni' : 'Student'}
                </Badge>
                {graduationYear && (
                  <Badge variant="outline">
                    Batch of {graduationYear}
                  </Badge>
                )}
              </div>
              {getConnectionButton(user.userId)}
            </div>
          );
        })}
      </div>
    </div>
  );
} 