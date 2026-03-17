import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Connection } from "@/models/connection.model";
import { User } from "@/models/user.model";

export async function GET() {
  await connectDB();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await Connection.find({
    status: "accepted",
    $or: [{ senderId: userId }, { receiverId: userId }],
  }).lean();

  const otherIds = Array.from(
    new Set(
      connections.map((c: any) =>
        c.senderId === userId ? c.receiverId : c.senderId
      )
    )
  );

  if (otherIds.length === 0) {
    return NextResponse.json([]);
  }

  const users = await User.find({ userId: { $in: otherIds } })
    .select("userId firstName lastName profilePhoto")
    .lean();

  return NextResponse.json(users);
}
