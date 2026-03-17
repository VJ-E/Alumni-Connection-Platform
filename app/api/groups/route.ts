import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/group.model";
import { Connection } from "@/models/connection.model";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await Group.find({ members: userId }).lean();
  return NextResponse.json(groups);
}

export async function POST(req: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, imageUrl, memberIds } = await req.json();

  if (!name || !memberIds || memberIds.length < 1) {
    return NextResponse.json(
      { error: "Name and at least 1 member required" },
      { status: 400 }
    );
  }

  const connections = await Connection.find({
    $or: [
      { senderId: userId, receiverId: { $in: memberIds } },
      { senderId: { $in: memberIds }, receiverId: userId },
    ],
  }).lean();

  const connectedUserIds = new Set();
  connections.forEach((c: any) => {
    connectedUserIds.add(c.senderId);
    connectedUserIds.add(c.receiverId);
  });

  for (const m of memberIds) {
    if (!connectedUserIds.has(m) && m !== userId) {
      return NextResponse.json(
        { error: `User ${m} is not connected to you` },
        { status: 403 }
      );
    }
  }

  const newGroup = await Group.create({
    name,
    imageUrl,
    members: [userId, ...memberIds],
    createdBy: userId,
  });

  return NextResponse.json(newGroup);
}
