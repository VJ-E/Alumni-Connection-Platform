import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import Opportunity from "@/models/opportunity.model";
import { NextRequest } from "next/server";
import { User } from "@/models/user.model";
import connectDB from "@/lib/db";

export async function GET() {
  try {
    await connectDB();
    const opportunities = await Opportunity.find().sort({ date: 1 });
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Check if user is an alumni or admin
    const user = await User.findOne({ userId });
    if (!user || (user.role !== 'alumni' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Only alumni and admins can create events' }, { status: 403 });
    }

    const data = await req.json();

    // Create new opportunity with the user's ID
    const opportunity = await Opportunity.create({
      ...data,
      createdBy: {
        ...data.createdBy,
        userId
      }
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
} 