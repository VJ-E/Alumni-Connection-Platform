import { NextResponse } from "next/server";
import { User } from "@/models/user.model";
import connectDB from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await connectDB();

    if (!params.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ userId: params.userId })
      .select(
        "role graduationYear profilePhoto firstName lastName email description linkedInUrl githubUrl department major"
      )
      .lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.userId || params.userId,
      role: user.role,
      graduationYear: user.graduationYear,
      profilePhoto: user.profilePhoto,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      description: user.description,
      linkedInUrl: user.linkedInUrl,
      githubUrl: user.githubUrl,
      department: user.department,
      major: user.major,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}