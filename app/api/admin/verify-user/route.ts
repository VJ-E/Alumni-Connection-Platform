import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/user.model";

interface RequestBody {
  userId: string;
  action: 'approve' | 'reject';
}

export async function POST(req: Request) {
  try {
    const { userId: adminUserId } = auth();
    
    if (!adminUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the current user is an admin
    const adminUser = await User.findOne({ userId: adminUserId });
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { userId, action }: RequestBody = await req.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "User ID and action are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user to verify
    const userToVerify = await User.findById(userId);
    if (!userToVerify) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Approve the user
      userToVerify.isVerified = true;
      await userToVerify.save();
      
      // Here you might want to send a notification email to the user
      // NotifyUserOfVerification(userToVerify.email, true);
    } else {
      // Reject the user - you might want to delete them or mark them as rejected
      // For now, we'll just delete the verification document
      userToVerify.verificationDocument = "";
      await userToVerify.save();
      
      // Here you might want to send a rejection email to the user
      // NotifyUserOfVerification(userToVerify.email, false);
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
    });
  } catch (error) {
    console.error("Error processing verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
