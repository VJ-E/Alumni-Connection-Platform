import { getUserById } from "@/lib/serveractions";
import ProfileForm from "@/components/ProfileForm";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Department } from "@/models/user.model";

type UserProfile = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  description: string;
  graduationYear: number | null;
  department: Department | "";
  major: string;
  role: "student" | "alumni" | "admin";
  linkedInUrl?: string;
  githubUrl?: string;
};

export default async function UserProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const { userId } = params;
  if (!userId) redirect("/");

  try {
    const [profile, session] = await Promise.all([
      getUserById(userId) as Promise<UserProfile | null>,
      getServerSession(authOptions),
    ]);

    if (!profile) {
      return (
        <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
          <div className="text-destructive text-lg font-medium">
            User not found
          </div>
        </div>
      );
    }

    const safeProfile: UserProfile = {
      userId: profile.userId || userId,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      profilePhoto: profile.profilePhoto || "/default-avatar.png",
      description: profile.description || "",
      graduationYear: profile.graduationYear || null,
      department: profile.department || "",
      major: profile.major || "",
      role: (profile.role as "student" | "alumni" | "admin") || "student",
      ...(profile.linkedInUrl && { linkedInUrl: profile.linkedInUrl }),
      ...(profile.githubUrl && { githubUrl: profile.githubUrl }),
    };

    const isCurrentUser = session?.user?.id === profile.userId;
    const currentUserProfile = session?.user?.id
      ? await getUserById(session.user.id)
      : null;

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
                readOnly={
                  !isCurrentUser && currentUserProfile?.role !== "admin"
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading profile:", error);
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive text-lg font-medium">
          An error occurred while loading the profile. Please try again later.
        </div>
      </div>
    );
  }
}