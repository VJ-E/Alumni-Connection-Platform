import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import { User } from "@/models/user.model";
import type { Department } from "@/models/user.model";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      email,
      password,
      firstName,
      lastName,
      graduationYear,
      department,
      description,
      linkedInUrl,
      githubUrl,
    } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !graduationYear || !department) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine role based on graduation year
    const currentYear = new Date().getFullYear();
    const gradYear = parseInt(graduationYear);
    const role = gradYear <= currentYear ? "alumni" : "student";

    // Generate a unique userId (same format used throughout the app)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user
    const user = await User.create({
      userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      graduationYear: gradYear,
      department: department as Department,
      description: description || "",
      linkedInUrl: linkedInUrl || "",
      githubUrl: githubUrl || "",
      profilePhoto: "/default-avatar.png",
      role,
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      userId: user.userId,
    });
  } catch (error) {
    console.error("Error in register:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
