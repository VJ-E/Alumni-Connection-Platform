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

    // Check if user exists and has completed onboarding
    const user = await User.findOne({ email });
    
    if (!user) {
      // User hasn't completed onboarding
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has the minimum required fields for onboarding
    const hasCompletedOnboarding = user.firstName && 
                                 user.lastName && 
                                 user.graduationYear && 
                                 user.department;

    if (!hasCompletedOnboarding) {
      // User exists but hasn't completed onboarding
      return NextResponse.json({ error: 'Onboarding incomplete' }, { status: 404 });
    }

    // User has completed onboarding
    return NextResponse.json({ 
      completed: true,
      user: {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        graduationYear: user.graduationYear,
        department: user.department,
        major: user.major,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error in check-onboarding:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
