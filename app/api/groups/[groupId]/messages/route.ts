import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/group.model";
import GroupMessage from "@/models/groupMessage.model";
import { Types } from "mongoose";

type GroupDocument = {
  _id: string;
  name: string;
  imageUrl?: string;
  members: string[];
  createdBy: string;
  createdAt: Date;
};

type LeanGroupMessage = {
  _id: any;
  groupId: any;
  senderId: any;
  content?: string;
  imageUrl?: string;
  createdAt: Date;
};

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await Group.findById(params.groupId).lean<GroupDocument>();
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!group.members.includes(userId)) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    const messages = await GroupMessage.find({
      groupId: new Types.ObjectId(params.groupId),
    })
      .sort({ createdAt: 1 })
      .lean();

    const formattedMessages = (messages as unknown as LeanGroupMessage[]).map(
      (msg) => ({
        ...msg,
        _id: msg._id.toString(),
        groupId: msg.groupId.toString(),
        senderId: msg.senderId.toString(),
        createdAt: new Date(msg.createdAt).toISOString(),
      })
    );

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch group messages" },
      { status: 500 }
    );
  }
}
