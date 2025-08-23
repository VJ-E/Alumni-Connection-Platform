import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import { Connection } from "@/models/connection.model";
import { User } from "@/models/user.model";

// GET /api/connections -> list of users that are connected to the current user
export async function GET() {
  await connectDB();
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all accepted connections where the current user is either side
  // NOTE: If your status field uses a different value than "accepted" (e.g. "connected"),
  // change it below accordingly.
  const connections = await Connection.find({
    status: "accepted",
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).lean();

  // Derive the "other" userIds from each connection
  const otherIds = Array.from(
    new Set(
      connections.map((c: any) => (c.senderId === userId ? c.receiverId : c.senderId))
    )
  );

  if (otherIds.length === 0) {
    return NextResponse.json([]);
  }

  // Return lightweight user docs for the picker
  const users = await User.find({ userId: { $in: otherIds } })
    .select("userId firstName lastName profilePhoto")
    .lean();

  return NextResponse.json(users);
}
