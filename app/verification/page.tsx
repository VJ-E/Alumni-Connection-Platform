"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IUser } from "@/models/user.model";
import { 
  Loader2, 
  X, 
  FileText, 
  User, 
  Mail, 
  GraduationCap, 
  Briefcase, 
  Phone, 
  Calendar, 
  ExternalLink as ExternalLinkIcon,
  Check 
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from 'date-fns';

interface UserWithVerification extends Omit<IUser, 'createdAt'> {
  _id: string;
  phoneNumber?: string;
  company?: string;
  createdAt?: Date;
}

export default function VerificationPage() {
  const { user: clerkUser } = useUser();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserWithVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [selectedUser, setSelectedUser] = useState<UserWithVerification | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (clerkUser?.id) {
        try {
          const response = await fetch(`/api/users/${clerkUser.id}`);
          if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            if (userData.role === 'admin') {
              fetchUnverifiedUsers();
            } else {
              setLoading(false);
            }
          }
        } catch (error) {
          console.error('Error fetching current user:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [clerkUser]);

  const fetchUnverifiedUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/unverified-users");
      if (!response.ok) {
        throw new Error("Failed to fetch unverified users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching unverified users:", error);
      toast.error("Failed to load unverified users");
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (userId: string, action: "approve" | "reject") => {
    try {
      setProcessing(prev => ({ ...prev, [userId]: true }));
      const response = await fetch(`/api/admin/verify-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      // Remove the user from the list
      setUsers(users.filter(u => u._id !== userId));
      toast.success(`User ${action === "approve" ? "approved" : "rejected"} successfully`);
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Failed to ${action} user`);
    } finally {
      setProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Check if current user is admin
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Verification</h1>
          <p className="text-muted-foreground">
            Review and verify user accounts
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No users pending verification</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <Card 
              key={user._id} 
              className="hover:shadow-md transition-shadow cursor-pointer" 
              onClick={() => setSelectedUser(user)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.profilePhoto} alt={user.firstName} />
                    <AvatarFallback>
                      {user.firstName?.[0]}
                      {user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {user.firstName} {user.lastName}
                      </h3>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {user.email}
                    </p>
                    {(user.department || user.graduationYear) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {user.department} {user.department && user.graduationYear ? '•' : ''} {user.graduationYear || ''}
                      </p>
                    )}
                    {user.verificationDocument && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Verification Document:</p>
                        <button 
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                        >
                          <FileText className="h-4 w-4" /> View Document
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* User Detail Modal */}
          <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
            {selectedUser && (
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <DialogTitle className="text-2xl font-bold">User Details</DialogTitle>
                      <DialogDescription>
                        Review user information and verification document
                      </DialogDescription>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="rounded-full p-1 hover:bg-gray-100"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* User Info Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedUser.profilePhoto} alt={selectedUser.firstName} />
                        <AvatarFallback>
                          {selectedUser.firstName?.[0]}
                          {selectedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </h3>
                        <Badge variant="outline" className="mt-1">
                          {selectedUser.role}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedUser.email}</span>
                      </div>
                      {selectedUser.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedUser.phoneNumber}</span>
                        </div>
                      )}
                      {selectedUser.department && (
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedUser.department}</span>
                        </div>
                      )}
                      {selectedUser.graduationYear && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Class of {selectedUser.graduationYear}</span>
                        </div>
                      )}
                      {selectedUser.company && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedUser.company}</span>
                        </div>
                      )}
                      {selectedUser.createdAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Joined {format(new Date(selectedUser.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verification Document Section */}
                  {selectedUser.verificationDocument && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Verification Document</h4>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="relative w-full h-[400px]">
                          <Image
                            src={selectedUser.verificationDocument}
                            alt="Verification document"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                            priority
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedUser.verificationDocument, '_blank')}
                        >
                          <ExternalLinkIcon className="h-4 w-4 mr-2" /> Open in New Tab
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleVerification(selectedUser._id, 'reject')}
                      disabled={processing[selectedUser._id]}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      {processing[selectedUser._id] ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleVerification(selectedUser._id, 'approve')}
                      disabled={processing[selectedUser._id]}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processing[selectedUser._id] ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        </div>
      )}
    </div>
  );
}
