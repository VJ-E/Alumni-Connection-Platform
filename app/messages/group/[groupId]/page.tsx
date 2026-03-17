import ConnectDB from "@/lib/db";
import Group from "@/models/group.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GroupChatWindow from "@/components/GroupChatWindow";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";

interface GroupDoc {
  _id: ObjectId;
  name: string;
  members: string[];
  createdBy: string;
  imageUrl?: string;
}

export default async function GroupPage({
  params,
}: {
  params: { groupId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  await ConnectDB();
  const group = await Group.findById(params.groupId).lean<GroupDoc>();

  if (!group) {
    return <div className="p-6">Group not found.</div>;
  }

  if (!group.members.includes(userId)) {
    return <div className="p-6">You are not a member of this group.</div>;
  }

  return (
    <div className="pt-20 max-w-6xl mx-auto">
      <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm h-[80vh] flex flex-col">
        <GroupChatWindow
          groupId={group._id.toString()}
          groupName={group.name}
          memberIds={group.members}
        />
      </div>
    </div>
  );
}
