import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagesList from "@/components/MessagesList";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userData = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
  };

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm">
          <h1 className="text-2xl font-bold p-6 border-b border-border">
            Messaging
          </h1>
          <MessagesList currentUser={userData} />
        </div>
      </div>
    </div>
  );
}