import { NextRequest, NextResponse } from "next/server";
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import connectDB from "@/lib/db";
import { User, type Department } from "@/models/user.model";
import { auth } from "@clerk/nextjs/server";
import { IUser } from "@/models/user.model";
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configure upload directory
const UPLOAD_DIR = join(process.cwd(), 'public/uploads/verification');
const UPLOAD_PATH_PREFIX = '/uploads/verification/';

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
    
    const { userId: authUserId } = auth();
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle form data (for file upload)
    const formData = await req.formData();
    
    // Extract text fields
    const clerkId = formData.get('clerkId')?.toString();
    const email = formData.get('email')?.toString();
    const firstName = formData.get('firstName')?.toString();
    const lastName = formData.get('lastName')?.toString();
    const graduationYear = formData.get('graduationYear')?.toString();
    const department = formData.get('department')?.toString();
    const major = formData.get('major')?.toString();
    const description = formData.get('description')?.toString();
    const linkedInUrl = formData.get('linkedInUrl')?.toString();
    const githubUrl = formData.get('githubUrl')?.toString();
    
    // Handle file upload
    const verificationImage = formData.get('verificationImage') as File | null;
    
    // Validate required fields
    if (!clerkId || !email || !firstName || !lastName || !graduationYear || !department) {
      return NextResponse.json(
        { error: 'Missing required fields: clerkId, email, firstName, lastName, graduationYear, department are required' }, 
        { status: 400 }
      );
    }
    
    // Validate verification image
    if (!verificationImage) {
      return NextResponse.json(
        { error: 'Verification document is required' },
        { status: 400 }
      );
    }

    // Upload verification document to Cloudinary
    const buffer = Buffer.from(await verificationImage.arrayBuffer());
    const uploadToCloudinary = () => new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        resource_type: 'image',
        folder: 'verification-documents'
      }, (error, result) => {
        if (error) return reject(error);
        if (!result || !result.secure_url) return reject(new Error('No URL returned from Cloudinary'));
        resolve(result.secure_url);
      });
      stream.end(buffer);
    });

    const verificationDocUrl = await uploadToCloudinary();

    // Create or update user
    let user = await User.findOne({ userId: authUserId });
    
    // Determine role based on graduation year
    const currentYear = new Date().getFullYear();
    const gradYear = graduationYear ? parseInt(graduationYear) : user?.graduationYear;
    const role = gradYear && gradYear <= currentYear ? 'alumni' : 'student';
    
    if (user) {
      // Update existing user
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.graduationYear = gradYear !== undefined ? gradYear : user.graduationYear;
      user.department = department as Department || user.department;
      user.major = major || user.major;
      user.description = description || user.description;
      user.linkedInUrl = linkedInUrl || user.linkedInUrl;
      user.githubUrl = githubUrl || user.githubUrl;
      
      // Only update role if not admin (admins can't be demoted)
      if (user.role !== 'admin') {
        user.role = role;
      }
      
      if (verificationDocUrl) {
        user.verificationDocument = verificationDocUrl;
      }
      
      await user.save();
      return NextResponse.json(user);
    } else {
      // Create new user
      const newUser = new User({
        userId: authUserId,
        email: email || '',
        firstName: firstName || '',
        lastName: lastName || '',
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        department: department as Department || '',
        major: major || '',
        description: description || '',
        linkedInUrl: linkedInUrl || '',
        githubUrl: githubUrl || '',
        verificationDocument: verificationDocUrl,
        profilePhoto: '/default-avatar.png',
        role: role, // Set role based on graduation year
        isVerified: false, // Set to false until admin verifies
      });

      await newUser.save();
      return NextResponse.json(newUser, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}