import ConnectDB from "@/lib/db";
import Group from "@/models/group.model";
import { auth } from "@clerk/nextjs/server";
import GroupChatWindow from "@/components/GroupChatWindow";
import { ObjectId } from 'mongodb';

interface Group {
    _id: ObjectId;
    name: string;
    members: string[];
    createdBy: string;
    imageUrl?: string;
    __v?: number;
  }

interface PageProps {
  params: { groupId: string };
}

export default async function GroupPage({ params }: PageProps) {
  const { userId } = auth();
  if (!userId) {
    return <div className="p-6">Unauthorized</div>;
  }
  
  await ConnectDB();
  const group = await Group.findById(params.groupId).lean<Group>();

  if (!group) {
    return <div className="p-6">Group not found.</div>;
  }

  if (!group.members.includes(userId)) {
    return <div className="p-6">You are not a member of this group.</div>;
  }

  return (
    <div className="pt-20 max-w-6xl mx-auto">
      <div className="bg-card text-card-foreground rounded-lg border border-border shadow-sm h-[80vh] flex flex-col">
        <GroupChatWindow groupId={group._id.toString()} groupName={group.name} memberIds={group.members} />
      </div>
    </div>
  );
}
