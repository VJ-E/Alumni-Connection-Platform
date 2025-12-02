import { getUserById } from "@/lib/serveractions";
import ProfileForm from "@/components/ProfileForm";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

// Import the Department type from the user model
import type { Department } from "@/models/user.model";

// Define the expected user profile type
type UserProfile = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  description: string;
  graduationYear: number | null;
  department: Department | ''; // Can be a Department value or empty string
  major: string; // Added missing major field
  role: 'student' | 'alumni' | 'admin';
  linkedInUrl?: string;
  githubUrl?: string;
};

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  if (!userId) {
    redirect("/");
  }

  try {
    const [profile, user] = await Promise.all([
      getUserById(userId) as Promise<UserProfile | null>,
      currentUser()
    ]);

    if (!profile) {
      return (
        <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
          <div className="text-destructive text-lg font-medium">User not found</div>
        </div>
      );
    }

    // Ensure required fields have default values
    const safeProfile: UserProfile = {
      userId: profile.userId || userId,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      profilePhoto: profile.profilePhoto || "/default-avatar.png",
      description: profile.description || "",
      graduationYear: profile.graduationYear || null,
      department: profile.department || '', // Default to empty string if not provided
      major: profile.major || '', // Added major field
      role: (profile.role as 'student' | 'alumni' | 'admin') || 'student', // Ensure role is one of the allowed values
      ...(profile.linkedInUrl && { linkedInUrl: profile.linkedInUrl }),
      ...(profile.githubUrl && { githubUrl: profile.githubUrl })
    };

    // If the current user is viewing their own profile, allow editing
    const isCurrentUser = user && user.id === profile.userId;
    const currentUserProfile = user?.id ? await getUserById(user.id) : null;
    return (
      <div className="pt-20 min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm">
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-8 text-foreground">
                {safeProfile.firstName} {safeProfile.lastName}&apos;s Profile
              </h1>
              <ProfileForm 
                initialData={safeProfile} 
                readOnly={!isCurrentUser && currentUserProfile?.role !== "admin"} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading profile:', error);
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive text-lg font-medium">
          An error occurred while loading the profile. Please try again later.
        </div>
      </div>
    );
  }
} 