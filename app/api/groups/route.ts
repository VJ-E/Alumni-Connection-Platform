import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/group.model";
import { Connection } from "@/models/connection.model"; // existing model

// GET: List all groups where current user is a member
export async function GET() {
  await dbConnect();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groups = await Group.find({ members: userId }).lean();
  return NextResponse.json(groups);
}

// POST: Create new group
export async function POST(req: Request) {
  await dbConnect();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, imageUrl, memberIds } = await req.json();

  // Validate members
  if (!name || !memberIds || memberIds.length < 1) {
    return NextResponse.json({ error: "Name and at least 1 member required" }, { status: 400 });
  }

  // Check all members are connected to creator
  const connections = await Connection.find({
    $or: [
      { senderId: userId, receiverId: { $in: memberIds } },
      { senderId: { $in: memberIds }, receiverId: userId }
    ]
  }).lean();

  const connectedUserIds = new Set();
  connections.forEach(c => {
    connectedUserIds.add(c.senderId);
    connectedUserIds.add(c.receiverId);
  });

  for (const m of memberIds) {
    if (!connectedUserIds.has(m) && m !== userId) {
      return NextResponse.json({ error: `User ${m} is not connected to you` }, { status: 403 });
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
