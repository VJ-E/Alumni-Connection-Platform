"use client";

import { useEffect, useState } from "react";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Button } from "./ui/button";
import { getAllUsers, sendConnectionRequest, getConnectionStatus } from "@/lib/serveractions";
import { IUser } from "@/models/user.model";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import { toast } from "react-toastify";
import { Badge } from "./ui/badge";

type UserType = 'all' | 'student' | 'alumni' | 'admin';

export default function PeopleList({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [processingConnections, setProcessingConnections] = useState<Record<string, boolean>>({});
  const [selectedTab, setSelectedTab] = useState<UserType>('all');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const allUsers = await getAllUsers();
        // Filter out the current user
        const otherUsers = allUsers.filter(
          (user: IUser) => user.userId !== currentUser?.id
        );
        setUsers(otherUsers);

        // Fetch connection status for each user
        const statuses: Record<string, string> = {};
        await Promise.all(
          otherUsers.map(async (user: IUser) => {
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
          <Button disabled className="w-full">
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
          <Button disabled className="w-full">
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

  return (
    <div>
      <div className="p-4 border-b">
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search people"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedTab === 'all' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('all')}
          >
            All Users ({users.length})
          </Button>
          <Button
            variant={selectedTab === 'student' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('student')}
          >
            Student Users ({users.filter(u => u.graduationYear && u.graduationYear > currentYear).length})
          </Button>
          <Button
            variant={selectedTab === 'alumni' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('alumni')}
          >
            Alumni Users ({users.filter(u => u.graduationYear && u.graduationYear <= currentYear).length})
          </Button>
          <Button
            variant={selectedTab === 'admin' ? 'default' : 'ghost'}
            onClick={() => setSelectedTab('admin')}
          >
            Admin ({users.filter(u => u.role === 'admin').length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredUsers.map((user) => {
          const graduationYear = user.graduationYear ? Number(user.graduationYear) : null;
          const isAlumni = graduationYear !== null && graduationYear <= currentYear;
          
          return (
            <div
              key={user.userId}
              className="bg-white p-6 rounded-lg border border-gray-300 flex flex-col items-center"
            >
              <ProfilePhoto src={user.profilePhoto || "/default-avatar.png"} />
              <h2 className="mt-4 font-semibold text-lg">
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