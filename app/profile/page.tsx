import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";
import { getUserProfile } from "@/lib/serveractions";
import { IUser } from "@/models/user.model";

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const profile = await getUserProfile();
  
  if (!profile) {
    redirect("/sign-in"); // Redirect to sign-in if no profile exists
  }

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-300">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-8">Profile</h1>
            <ProfileForm initialData={profile} />
          </div>
        </div>
      </div>
    </div>
  );
} 