import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Group from "@/models/group.model";
import GroupMessage, { IGroupMessage } from "@/models/groupMessage.model";
import mongoose, { HydratedDocument, Types } from "mongoose";

// Add this type at the top of the file
type GroupDocument = {
    _id: string;
    name: string;
    imageUrl?: string;
    members: string[];
    createdBy: string;
    createdAt: Date;
  };
  
  // Then modify your GET function
  export async function GET(req: Request, { params }: { params: { groupId: string } }) {
    try {
      console.log(`[${new Date().toISOString()}] Fetching messages for group:`, params.groupId);
      
      await dbConnect();
      const { userId } = auth();
      
      if (!userId) {
        console.error('No user ID found in session');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    
      console.log('User ID from auth:', userId);
      
      const group = await Group.findById(params.groupId).lean<GroupDocument>();
      if (!group) {
        console.error('Group not found:', params.groupId);
        return NextResponse.json({ error: "Group not found" }, { status: 404 });
      }
      
      console.log('Group members:', group.members);
      
      if (!group.members.includes(userId)) {
        console.error(`User ${userId} is not a member of group ${params.groupId}`);
        return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
      }
    
      console.log('Querying messages for group:', params.groupId);
      
      // Find messages and convert _id to string
            const messages = await GroupMessage.find({ groupId: new Types.ObjectId(params.groupId) })
        .sort({ createdAt: 1 })
        .lean();
        
      console.log('Raw messages from DB:', JSON.stringify(messages, null, 2));
      
      // Define the type for the lean document
      type LeanGroupMessage = {
        _id: any;
        groupId: any;
        senderId: any;
        content?: string;
        imageUrl?: string;
        createdAt: Date;
      };

      const formattedMessages = (messages as unknown as LeanGroupMessage[]).map((msg) => ({
        ...msg,
        _id: msg._id.toString(),
        groupId: msg.groupId.toString(),
        senderId: msg.senderId.toString(),
        createdAt: new Date(msg.createdAt).toISOString()
      }));
      
      console.log('Formatted messages:', JSON.stringify(formattedMessages, null, 2));
      
      return NextResponse.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching group messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch group messages" },
        { status: 500 }
      );
    }
  }
