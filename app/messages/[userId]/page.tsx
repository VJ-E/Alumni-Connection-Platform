import { currentUser } from "@clerk/nextjs/server";
import { getUserById } from "@/lib/serveractions";
import ChatWindow from "@/components/ChatWindow";
import { redirect } from "next/navigation";
import type { Department } from "@/models/user.model";

// Define the expected user type for chat
interface ChatUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  description: string;
  graduationYear: number | null;
  department: Department | '';
  major: string;
  role: 'student' | 'alumni' | 'admin';
  linkedInUrl?: string;
  githubUrl?: string;
  isVerified: boolean;
  verificationDocument?: string;
}

export default async function ChatPage({ params }: { params: { userId: string } }) {
  try {
    const user = await currentUser();
    if (!user) {
      redirect("/sign-in");
      return null; // This line is needed to make TypeScript happy
    }

    const [otherUser, currentUserData] = await Promise.all([
      getUserById(params.userId) as Promise<ChatUser | null>,
      getUserById(user.id) as Promise<ChatUser | null>
    ]);

    if (!otherUser) {
      // Show a more user-friendly error message
      return (
        <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
          <div className="text-destructive text-lg font-medium">
            The user you&apos;re trying to message doesn&apos;t exist or has been deleted.
          </div>
        </div>
      );
    }

    if (!currentUserData) {
      redirect("/sign-in");
      return null; // This line is needed to make TypeScript happy
    }

    // Ensure both users have the required properties
    const safeCurrentUser: ChatUser = {
      userId: currentUserData.userId || user.id,
      firstName: currentUserData.firstName || "",
      lastName: currentUserData.lastName || "",
      email: currentUserData.email || "",
      profilePhoto: currentUserData.profilePhoto || "/default-avatar.png",
      description: currentUserData.description || "",
      graduationYear: currentUserData.graduationYear || null,
      department: currentUserData.department || '',
      major: currentUserData.major || '',
      role: (currentUserData.role as 'student' | 'alumni' | 'admin') || 'student',
      isVerified: currentUserData.isVerified || false,
      ...(currentUserData.linkedInUrl && { linkedInUrl: currentUserData.linkedInUrl }),
      ...(currentUserData.githubUrl && { githubUrl: currentUserData.githubUrl }),
      ...(currentUserData.verificationDocument && { verificationDocument: currentUserData.verificationDocument })
    };

    const safeOtherUser: ChatUser = {
      userId: otherUser.userId || params.userId,
      firstName: otherUser.firstName || "",
      lastName: otherUser.lastName || "",
      email: otherUser.email || "",
      profilePhoto: otherUser.profilePhoto || "/default-avatar.png",
      description: otherUser.description || "",
      graduationYear: otherUser.graduationYear || null,
      department: otherUser.department || '',
      major: otherUser.major || '',
      role: (otherUser.role as 'student' | 'alumni' | 'admin') || 'student',
      isVerified: otherUser.isVerified || false,
      ...(otherUser.linkedInUrl && { linkedInUrl: otherUser.linkedInUrl }),
      ...(otherUser.githubUrl && { githubUrl: otherUser.githubUrl }),
      ...(otherUser.verificationDocument && { verificationDocument: otherUser.verificationDocument })
    };

    return (
      <div className="pt-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm h-[calc(100vh-8rem)]">
            <ChatWindow currentUser={safeCurrentUser} otherUser={safeOtherUser} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in ChatPage:', error);
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive text-lg font-medium">
          An error occurred while loading the chat. Please try again later.
        </div>
      </div>
    );
  }
} 