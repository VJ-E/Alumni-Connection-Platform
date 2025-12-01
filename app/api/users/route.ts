import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User, type Department } from "@/models/user.model";
import { auth } from "@clerk/nextjs/server";
import { IUser } from "@/models/user.model";

// GET user by email
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
    if (user.role !== role && user.role !== 'admin') {
      user.role = role;
      await user.save();
    }

    return NextResponse.json({
      userId: user.userId, // Keep as userId for compatibility
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profilePhoto: user.profilePhoto,
      description: user.description,
      graduationYear: user.graduationYear,
      department: user.department,
      major: user.major, // Added major field
      role: role,
      linkedInUrl: user.linkedInUrl,
      githubUrl: user.githubUrl
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Create or update user profile
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      clerkId, 
      email, 
      firstName, 
      lastName, 
      graduationYear, 
      department,
      major,
      description,
      linkedInUrl,
      githubUrl,
      profilePhoto = '/default-avatar.png'
    } = body;

    // Validate required fields
    if (!clerkId || !email || !firstName || !lastName || !graduationYear || !department) {
      return NextResponse.json(
        { error: 'Missing required fields: clerkId, email, firstName, lastName, graduationYear, department are required' }, 
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ userId: clerkId }); // Map clerkId to userId
    
    if (user) {
      // Update existing user
      const updatedUser = await User.findOneAndUpdate(
        { userId: clerkId }, // Map clerkId to userId
        {
          firstName,
          lastName,
          email,
          graduationYear: parseInt(graduationYear as string),
          department: department as Department,
          major: major || '',
          description: description || '',
          linkedInUrl: linkedInUrl || '',
          githubUrl: githubUrl || '',
          profilePhoto,
          role: (parseInt(graduationYear as string) <= new Date().getFullYear() ? 'alumni' : 'student') as 'alumni' | 'student'
        },
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error('Failed to update user');
      }
      user = updatedUser;
    } else {
      // Create new user
      const newUser = new User({
        userId: clerkId, // Map clerkId to userId
        email,
        firstName,
        lastName,
        graduationYear: parseInt(graduationYear as string),
        department: department as Department,
        major: major || '',
        description: description || '',
        linkedInUrl: linkedInUrl || '',
        githubUrl: githubUrl || '',
        profilePhoto,
        role: (parseInt(graduationYear as string) <= new Date().getFullYear() ? 'alumni' : 'student') as 'alumni' | 'student'
      });
      user = await newUser.save();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        userId: user.userId, // Keep as userId for compatibility
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePhoto: user.profilePhoto,
        graduationYear: user.graduationYear,
        department: user.department,
        major: user.major, // Added major field
        description: user.description,
        linkedInUrl: user.linkedInUrl,
        githubUrl: user.githubUrl
      }
    });

  } catch (error) {
    console.error('Error in user registration:', error);
    return NextResponse.json(
      { error: 'Failed to process user registration' }, 
      { status: 500 }
    );
  }
}