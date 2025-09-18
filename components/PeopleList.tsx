"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProfilePhoto from "./shared/ProfilePhoto";
import { Button } from "./ui/button";
import { getAllUsers, sendConnectionRequest, getConnectionStatus } from "@/lib/serveractions";
import { IUser, Department } from "@/models/user.model";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { useOnlineStatus } from "./OfflineIndicator";
import DepartmentFilter from "./DepartmentFilter";

type UserType = 'all' | 'student' | 'alumni' | 'admin';

// Map department values to display names
const departmentDisplayNames: Record<Department, string> = {
  'CSE(AI&ML)': 'CSE (AI & ML)',
  'CSE': 'Computer Science',
  'CSBS': 'Computer Science & Business Systems',
  'AI&DS': 'AI & Data Science',
  '': 'Not Specified'
};

export default function PeopleList({ currentUser }: { currentUser: any }) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, string>>({});
  const [processingConnections, setProcessingConnections] = useState<Record<string, boolean>>({});
  const [selectedTab, setSelectedTab] = useState<UserType>('all');
  const searchParams = useSearchParams();
  const selectedDepartment = searchParams?.get('dept') as Department || 'all';
  const isOnline = useOnlineStatus();

  // Filter users based on search term, selected tab, and department
  useEffect(() => {
    if (!users.length) return;
    
    let result = [...users];
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const getDepartmentDisplayName = (dept: Department): string => {
        return departmentDisplayNames[dept] || dept || 'Not Specified';
      };
      result = result.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          (user.department && getDepartmentDisplayName(user.department).toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by user type (tab)
    if (selectedTab !== 'all') {
      result = result.filter((user) => {
        if (selectedTab === 'alumni') return user.role === 'alumni';
        if (selectedTab === 'student') return user.role === 'student';
        if (selectedTab === 'admin') return user.role === 'admin';
        return true;
      });
    }
    
    // Filter by department
    if (selectedDepartment !== 'all') {
      result = result.filter((user) => user.department === selectedDepartment);
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, selectedTab, selectedDepartment]);

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
        setFilteredUsers(otherUsers as IUser[]);

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

  const getDepartmentDisplayName = (dept: Department): string => {
    return departmentDisplayNames[dept] || dept || 'Not Specified';
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="pb-4">
      <div className="sticky top-[4rem] z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-80">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, email, or department..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {(['all', 'student', 'alumni', 'admin'] as UserType[]).map((tab) => (
                  <Button
                    key={tab}
                    variant={selectedTab === tab ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full capitalize whitespace-nowrap"
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab}
                  </Button>
                ))}
              </div>
              <div className="hidden sm:block h-6 w-px bg-border mx-1" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Department:</span>
                <DepartmentFilter variant="dropdown" />
              </div>
            </div>
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
              <ProfilePhoto src={user.profilePhoto} userId={user.userId} />
              <div className="text-sm text-muted-foreground">
                {getDepartmentDisplayName(user.department)}
                {user.graduationYear && ` • Class of ${user.graduationYear}`}
              </div>
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