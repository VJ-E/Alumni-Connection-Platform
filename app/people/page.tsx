import { currentUser } from "@clerk/nextjs/server";
import PeopleList from "@/components/PeopleList";

export default async function PeoplePage() {
  const user = await currentUser();
  const userData = JSON.parse(JSON.stringify(user));

  return (
    <div className="pt-20">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 px-4">People You May Know</h1>
        <PeopleList currentUser={userData} />
      </div>
    </div>
  );
} 