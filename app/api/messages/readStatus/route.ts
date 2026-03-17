import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import ConversationReadStatus from "@/models/ConversationReadStatus";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");

    if (!partnerId) {
      return NextResponse.json(
        { error: "partnerId is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // We want to know when the PARTNER last read the conversation
    // so we look for a record where userId = partnerId and partnerId = currentUser
    const readStatus = await ConversationReadStatus.findOne({
      userId: partnerId,
      partnerId: session.user.id,
    });

    if (!readStatus) {
      return NextResponse.json({ lastReadAt: null });
    }

    return NextResponse.json({ lastReadAt: readStatus.lastReadAt });
  } catch (error) {
    console.error("Error in readStatus GET:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
