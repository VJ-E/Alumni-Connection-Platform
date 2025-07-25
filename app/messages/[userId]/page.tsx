import { currentUser } from "@clerk/nextjs/server";
import { getUserById } from "@/lib/serveractions";
import ChatWindow from "@/components/ChatWindow";
import { redirect } from "next/navigation";

export default async function ChatPage({ params }: { params: { userId: string } }) {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const otherUser = await getUserById(params.userId);
  if (!otherUser) {
    redirect("/messages");
  }

  // Get current user data in the same format as otherUser
  const currentUserData = await getUserById(user.id);
  if (!currentUserData) {
    redirect("/sign-in");
  }

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-300 h-[calc(100vh-8rem)]">
          <ChatWindow currentUser={currentUserData} otherUser={otherUser} />
        </div>
      </div>
    </div>
  );
} 