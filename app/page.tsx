import Feed from "@/components/Feed";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userData = {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
    image: session.user.image || "",
  };

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto flex justify-between gap-8 px-4">
        <Feed user={userData} />
      </div>
    </div>
  );
}
