import { NextResponse } from "next/server";
import db from "@/lib/db";
import { User } from "@/models/user.model";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    await db();
    const user = await User.findOne({ userId: params.userId });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      role: user.role,
      graduationYear: user.graduationYear,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 