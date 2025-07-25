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
      <div className="pt-20 text-center text-red-500">User not found</div>
    );
  }

  // If the current user is viewing their own profile, allow editing
  const isCurrentUser = user && user.id === profile.userId;
  const currentUserProfile = await getUserById(user?.id || "");
  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-300">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-8">Profile</h1>
            <ProfileForm initialData={profile} readOnly={!isCurrentUser && currentUserProfile?.role !== "admin"} />
          </div>
        </div>
      </div>
    </div>
  );
} 