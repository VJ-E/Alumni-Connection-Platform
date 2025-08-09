import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';


// Import Message model after connection is established
const Message = mongoose.models.Message || mongoose.model('Message', new mongoose.Schema({
  senderId: String,
  receiverId: String,
  content: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  isOptimistic: { type: Boolean, default: false }
}));

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const receiverId = searchParams.get('receiverId');
    
    if (!receiverId) {
      return NextResponse.json(
        { error: 'Receiver ID is required' },
        { status: 400 }
      );
    }

    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Find messages between the two users
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .lean(); // Convert to plain JavaScript objects

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
