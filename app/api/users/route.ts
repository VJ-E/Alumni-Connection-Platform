import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { User, type Department } from "@/models/user.model";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const role =
      user.graduationYear && user.graduationYear <= currentYear
        ? "alumni"
        : "student";

    if (user.role !== role && user.role !== "admin") {
      user.role = role;
      await user.save();
    }

    return NextResponse.json({
      userId: user.userId,
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePhoto: user.profilePhoto,
      description: user.description,
      graduationYear: user.graduationYear,
      department: user.department,
      role,
      linkedInUrl: user.linkedInUrl,
      githubUrl: user.githubUrl,
    });
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      graduationYear,
      department,
      description,
      linkedInUrl,
      githubUrl,
      profilePhoto,
    } = body;

    const userId = session.user.id;

    const updatedUser = await User.findOneAndUpdate(
      { userId },
      {
        firstName,
        lastName,
        graduationYear: parseInt(graduationYear as string),
        department: department as Department,
        description: description || "",
        linkedInUrl: linkedInUrl || "",
        githubUrl: githubUrl || "",
        profilePhoto: profilePhoto || "/default-avatar.png",
        role:
          parseInt(graduationYear as string) <= new Date().getFullYear()
            ? "alumni"
            : "student",
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}