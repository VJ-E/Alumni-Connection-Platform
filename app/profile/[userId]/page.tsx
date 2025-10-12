import { getUserById } from "@/lib/serveractions";
import ProfileForm from "@/components/ProfileForm";
import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const profile = await getUserById(userId);
  const user = await currentUser();

  if (!profile) {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive text-lg font-medium">User not found</div>
      </div>
    );
  }

  // If the current user is viewing their own profile, allow editing
  const isCurrentUser = user && user.id === profile.userId;
  const currentUserProfile = await getUserById(user?.id || "");
  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-8 text-foreground">Profile</h1>
            <ProfileForm initialData={profile} readOnly={!isCurrentUser && currentUserProfile?.role !== "admin"} />
          </div>
        </div>
      </div>
    </div>
  );
} 