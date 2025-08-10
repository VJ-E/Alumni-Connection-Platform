import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectDB from "@/lib/db";
import ConversationReadStatus from "@/models/ConversationReadStatus";

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { partnerId } = await req.json();
    if (!partnerId) {
      return NextResponse.json({ error: "partnerId required" }, { status: 400 });
    }

    await connectDB();
    await ConversationReadStatus.findOneAndUpdate(
      { userId, partnerId },
      { lastReadAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}