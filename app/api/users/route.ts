import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/user.model";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const email = req.nextUrl.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine role based on graduation year
    const currentYear = new Date().getFullYear();
    const role = user.graduationYear && user.graduationYear <= currentYear ? 'alumni' : 'student';

    // Update user role if it's different
    if (user.role !== role) {
      user.role = role;
      await user.save();
    }

    return NextResponse.json({
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePhoto: user.profilePhoto,
      description: user.description,
      graduationYear: user.graduationYear,
      role: role // Return the calculated role
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 