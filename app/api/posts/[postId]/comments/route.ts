import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Comment } from "@/models/comment.model";
import { Post } from "@/models/post.model";

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const postId = params.postId;
    const body = await req.json();
    const { textMessage } = body;

    if (!textMessage) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    // Since we're directly calling the DB instead of the server action here to preserve
    // the route structure, we need to assemble the user object. For brevity, assuming
    // session.user contains what we need (name, email, image) from our auth handler.
    const newComment = await Comment.create({
      textMessage,
      user: {
        userId,
        // Optional: populate remainder based on what the frontend expects
      },
    });

    await Post.findByIdAndUpdate(postId, {
      $push: { comments: newComment._id },
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error) {
    console.error("Error in POST /api/posts/[postId]/comments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}