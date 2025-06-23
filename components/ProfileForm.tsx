"use client";

import { useState } from "react";
import { IUser } from "@/models/user.model";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { updateProfile } from "@/lib/serveractions";
import Image from "next/image";
import { toast } from "react-toastify";

export default function ProfileForm({ initialData }: { initialData: IUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: initialData.firstName,
    lastName: initialData.lastName,
    description: initialData.description || "",
    graduationYear: initialData.graduationYear || "",
    profilePhoto: initialData.profilePhoto || "/default-avatar.png",
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        profilePhoto: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile({
        ...formData,
        graduationYear: Number(formData.graduationYear)
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative h-24 w-24">
              <Image
                src={initialData.profilePhoto || "/default-avatar.png"}
                alt="Profile"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {initialData.firstName} {initialData.lastName}
              </h2>
              <p className="text-gray-600">Batch of {initialData.graduationYear}</p>
            </div>
          </div>
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-gray-600">
              {initialData.description || "No description added yet."}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Email</h3>
            <p className="text-gray-600">{initialData.email}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative h-24 w-24">
            <Image
              src={formData.profilePhoto}
              alt="Profile"
              fill
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-2"
            />
            <p className="text-sm text-gray-500">Max size: 5MB</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <Input
              value={formData.firstName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <Input
              value={formData.lastName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
              }
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Graduation Year
          </label>
          <Input
            type="number"
            value={formData.graduationYear}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, graduationYear: e.target.value }))
            }
            min="1900"
            max="2100"
          />
        </div>

        <div className="flex space-x-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
} 