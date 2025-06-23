import { currentUser } from "@clerk/nextjs/server";
import MessagesList from "@/components/MessagesList";

export default async function MessagesPage() {
  const user = await currentUser();
  const userData = JSON.parse(JSON.stringify(user));

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-300">
          <h1 className="text-2xl font-bold p-6 border-b">Messaging</h1>
          <MessagesList currentUser={userData} />
        </div>
      </div>
    </div>
  );
} 