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

  // Extract only the necessary user data
  const currentUserData = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl
  };

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