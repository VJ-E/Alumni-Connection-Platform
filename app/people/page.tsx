import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PeopleList from "@/components/PeopleList";

export default async function PeoplePage() {
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
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-6 text-foreground">
          People You May Know
        </h1>
        <PeopleList currentUser={userData} />
      </div>
    </div>
  );
}