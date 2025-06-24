import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import Opportunity from "@/models/opportunity.model";

export async function GET() {
  try {
    await db();
    const opportunities = await Opportunity.find().populate('createdBy').sort({ date: 1 });
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = getAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db();
    const data = await req.json();

    // Create new opportunity
    const opportunity = await Opportunity.create({
      ...data,
      createdBy: userId,
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 