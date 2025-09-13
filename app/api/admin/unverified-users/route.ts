import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/user.model";

export async function GET() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the current user is an admin
    const currentUser = await User.findOne({ userId });
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    // Find all users who are not verified
    const unverifiedUsers = await User.find({
      isVerified: false,
      verificationDocument: { $ne: "" } // Only include users who have uploaded a document
    })
      .select('-__v -createdAt -updatedAt -password')
      .lean();

    // Convert _id to string for serialization and type the user object
    const users = unverifiedUsers.map((user: any) => ({
      ...user,
      _id: user._id.toString()
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching unverified users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
