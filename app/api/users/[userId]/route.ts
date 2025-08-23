import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { User } from "@/models/user.model";
import connectDB from "@/lib/db";

// Type for our mongoose cache
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Initialize the cache
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGO_URI environment variable");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: MongooseCache = (global as any).mongoose || { conn: null, promise: null };

if (!(global as any).mongoose) {
  (global as any).mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = connectDB();
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await dbConnect();
    
    if (!params.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Fetching user with ID:', params.userId);
    
    // Find user by userId (Clerk ID)
    const user = await User.findOne({
      userId: params.userId
    }).select('role graduationYear profilePhoto firstName lastName email description').lean();
    
    console.log('User query result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      console.error(`User not found with ID: ${params.userId}`);
      return NextResponse.json({ 
        error: 'User not found',
        userId: params.userId
      }, { status: 404 });
    }

    return NextResponse.json({
      userId: user.userId || user._id.toString(),
      role: user.role,
      graduationYear: user.graduationYear,
      profilePhoto: user.profilePhoto,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      description: user.description,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}