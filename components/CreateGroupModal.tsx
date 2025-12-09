"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { toast } from "react-toastify";
import { Loader2, Image as ImageIcon, X } from "lucide-react";
import { useOnlineStatus } from "./OfflineIndicator";

interface Connection {
    userId: string;            // Clerk user ID
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  }

// Uploads a base64 image to our API endpoint which then uploads to Cloudinary
async function uploadGroupImage(base64Image: string): Promise<string> {
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
    console.error('Error uploading image:', error);
    toast.error('Failed to upload image. Please try again.');
    throw error;
  }
}

export default function CreateGroupModal({ onGroupCreated }: { onGroupCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (open) {
      // Fetch user's connections (adjust if your API path is different)
      fetch("/api/connections")
        .then(res => res.json())
        .then(data => setConnections(data));
    }
  }, [open]);

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

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

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  const createGroup = async () => {
    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    if (!isOnline) {
      toast.error("You are offline. Please check your connection and try again.");
      return;
    }

    try {
      setIsUploading(true);
      let uploadedImageUrl = '';

      // Upload image if selected
      if (imageFile) {
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        
        uploadedImageUrl = await uploadGroupImage(base64Image);
      }

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: name.trim(), 
          imageUrl: uploadedImageUrl, 
          memberIds: selectedMembers 
        })
      });

      if (res.ok) {
        toast.success('Group created successfully!');
        onGroupCreated();
        setOpen(false);
        resetForm();
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to create group");
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setImageFile(null);
    setImagePreview(null);
    setSelectedMembers([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button className="ml-auto">Create Group</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Group Name *</label>
            <Input 
              placeholder="Enter group name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Group Image (optional)</label>
            <div className="mt-1 flex items-center gap-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              
              {imagePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null);
                    setImageFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>
            
            {imagePreview && (
              <div className="mt-2">
                <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Group preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="font-semibold mb-2">Select Members:</p>
            <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
              {connections.map(c => (
                <div
                  key={c.userId}
                  className={`p-2 cursor-pointer rounded ${selectedMembers.includes(c.userId) ? "bg-blue-200" : "bg-gray-100"}`}
                  onClick={() => toggleMember(c.userId)}
                >
                  {c.firstName} {c.lastName}
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={createGroup} 
            className="w-full"
            disabled={isUploading || !name.trim() || selectedMembers.length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
