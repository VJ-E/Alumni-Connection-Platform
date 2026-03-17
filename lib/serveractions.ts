"use server"

import { Post } from "@/models/post.model";
import { IUser, User, Department } from "@/models/user.model";
import { Message } from "@/models/message.model";
import { Connection } from "@/models/connection.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "./db";
import { revalidatePath } from "next/cache";
import { Comment } from "@/models/comment.model";
import { Types } from "mongoose";
import ConversationReadStatus from "@/models/ConversationReadStatus";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface SafeUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  department: string;
  description: string;
  graduationYear: number | null;
  role: string;
  linkedInUrl: string;
}

interface SafeComment {
  _id: string;
  textMessage: string;
  user: SafeUser;
  createdAt: string;
  updatedAt: string;
}

interface SafePost {
  _id: string;
  description: string;
  user: SafeUser;
  imageUrl?: string;
  likes?: string[];
  comments?: SafeComment[];
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const serializeDocument = (doc: any): SafePost | null => {
  if (!doc) return null;
  const plainDoc = { ...doc };

  if (plainDoc._id) plainDoc._id = plainDoc._id.toString();

  if (plainDoc.user) {
    plainDoc.user = {
      userId: plainDoc.user.userId || "",
      firstName: plainDoc.user.firstName || "",
      lastName: plainDoc.user.lastName || "",
      email: plainDoc.user.email || "",
      profilePhoto: plainDoc.user.profilePhoto || "/default-avatar.png",
      department: plainDoc.user.department || "",
      description: plainDoc.user.description || "",
      graduationYear: plainDoc.user.graduationYear || null,
      linkedInUrl: plainDoc.user.linkedInUrl || "",
      role: plainDoc.user.role || "student",
    };
  }

  if (Array.isArray(plainDoc.comments)) {
    plainDoc.comments = plainDoc.comments.map((comment: any) => ({
      _id: comment._id?.toString() || "",
      textMessage: comment.textMessage || "",
      user: comment.user
        ? {
            userId: comment.user.userId || "",
            firstName: comment.user.firstName || "",
            lastName: comment.user.lastName || "",
            email: comment.user.email || "",
            profilePhoto:
              comment.user.profilePhoto || "/default-avatar.png",
            department: comment.user.department || "",
            description: comment.user.description || "",
            graduationYear: comment.user.graduationYear || null,
            linkedInUrl: comment.user.linkedInUrl || "",
            role: comment.user.role || "student",
          }
        : null,
      createdAt: comment.createdAt?.toString() || new Date().toISOString(),
      updatedAt: comment.updatedAt?.toString() || new Date().toISOString(),
    }));
  }

  delete plainDoc.__v;
  delete plainDoc.$locals;
  delete plainDoc.$op;

  return {
    _id: plainDoc._id || "",
    description: plainDoc.description || "",
    user: plainDoc.user,
    imageUrl: plainDoc.imageUrl,
    likes: plainDoc.likes || [],
    comments: plainDoc.comments || [],
    createdAt: plainDoc.createdAt?.toString() || new Date().toISOString(),
    updatedAt: plainDoc.updatedAt?.toString() || new Date().toISOString(),
  };
};

// Takes a userId string and returns a safe user object from DB
const createSafeUserObject = async (userId: string): Promise<SafeUser | null> => {
  if (!userId) return null;
  await connectDB();
  const userProfile = await User.findOne({ userId }).lean();
  if (!userProfile) return null;

  const currentYear = new Date().getFullYear();
  const role =
    userProfile.graduationYear && userProfile.graduationYear <= currentYear
      ? "alumni"
      : "student";

  return {
    userId: userProfile.userId,
    firstName: userProfile.firstName || "",
    lastName: userProfile.lastName || "",
    email: userProfile.email || "",
    profilePhoto: userProfile.profilePhoto || "/default-avatar.png",
    department: userProfile.department || "",
    description: userProfile.description || "",
    graduationYear: userProfile.graduationYear || null,
    linkedInUrl: userProfile.linkedInUrl || "",
    role: userProfile.role || role,
  };
};

// ─── Read Actions ─────────────────────────────────────────────────────────────

export const getAllPosts = async (): Promise<SafePost[]> => {
  try {
    await connectDB();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({ path: "comments", options: { sort: { createdAt: -1 } } })
      .lean()
      .exec();

    if (!posts) return [];

    const postsWithUpdatedUserData = await Promise.all(
      posts.map(async (post) => {
        try {
          const userProfile = await User.findOne({
            userId: post.user?.userId,
          }).lean();
          if (userProfile) {
            post.user = {
              userId: post.user.userId,
              firstName: post.user.firstName,
              lastName: post.user.lastName,
              email: post.user.email,
              profilePhoto: post.user.profilePhoto,
              department: post.user.department,
              description: post.user.description || "",
              graduationYear: userProfile.graduationYear,
              linkedInUrl: userProfile.linkedInUrl || "",
              role: userProfile.role || "student",
            };
          }
          return post;
        } catch (error) {
          return post;
        }
      })
    );

    const safePosts = postsWithUpdatedUserData
      .filter((post) => post && post.user)
      .map((post) => serializeDocument(post))
      .filter((post): post is SafePost => post !== null);

    return safePosts;
  } catch (error) {
    console.error("Error in getAllPosts:", error);
    return [];
  }
};

export const getAllUsers = async () => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    const query = currentUserId ? { userId: { $ne: currentUserId } } : {};
    const users = await User.find(query).lean().exec();

    return users.map((user) => ({
      userId: user.userId,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      profilePhoto: user.profilePhoto || "/default-avatar.png",
      department: user.department || "",
      description: user.description || "",
      graduationYear: user.graduationYear || null,
      linkedInUrl: user.linkedInUrl || "",
      role: user.role || "student",
      major: user.major || "",
    }));
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return [];
  }
};

export const getUserById = async (userId: string) => {
  try {
    await connectDB();
    const user = await User.findOne({ userId }).lean();
    if (!user) return null;

    const department: Department | undefined =
      user.department &&
      ["CSE(AI&ML)", "CSE", "CSBS", "AI&DS"].includes(user.department)
        ? (user.department as Department)
        : undefined;

    return {
      userId: user.userId,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      profilePhoto: user.profilePhoto || "/default-avatar.png",
      department,
      description: user.description || "",
      graduationYear: user.graduationYear || null,
      linkedInUrl: user.linkedInUrl || "",
      githubUrl: user.githubUrl || "",
      role: user.role || "student",
      major: user.major || "",
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

export const getUserProfile = async () => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const profile = await User.findOne({ userId: session.user.id }).lean();
    if (!profile) return null;

    const currentYear = new Date().getFullYear();
    const calculatedRole =
      profile.graduationYear && profile.graduationYear <= currentYear
        ? ("alumni" as const)
        : ("student" as const);

    return {
      userId: profile.userId,
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      profilePhoto: profile.profilePhoto || "/default-avatar.png",
      description: profile.description || "",
      department: profile.department || "",
      graduationYear: profile.graduationYear || null,
      linkedInUrl: profile.linkedInUrl || "",
      githubUrl: profile.githubUrl || "",
      role: calculatedRole,
    };
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    return null;
  }
};

export const getConnectedUsers = async () => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];
    const userId = session.user.id;

    const connections = await Connection.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: "accepted",
    });

    const connectedUserIds = connections.map((conn) =>
      conn.senderId === userId ? conn.receiverId : conn.senderId
    );

    const users = await User.find({
      userId: { $in: connectedUserIds },
    }).lean();

    return JSON.parse(
      JSON.stringify(
        users.map((user) => ({
          userId: user.userId,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          profilePhoto: user.profilePhoto || "/default-avatar.png",
          department: user.department || "",
          description: user.description || "",
          graduationYear: user.graduationYear || null,
          linkedInUrl: user.linkedInUrl || "",
          role: user.role || "student",
        }))
      )
    );
  } catch (error) {
    console.error("Error fetching connected users:", error);
    return [];
  }
};

export const getConnectionStatus = async (otherUserId: string) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;
    const userId = session.user.id;

    const connection = await Connection.findOne({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    });

    return connection ? connection.status : null;
  } catch (error) {
    console.error("Error checking connection status:", error);
    return null;
  }
};

export const getConnectionRequests = async () => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];
    const userId = session.user.id;

    const requests = await Connection.find({
      receiverId: userId,
      status: "pending",
    }).sort({ createdAt: -1 });

    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const sender = await User.findOne({
          userId: request.senderId,
        }).lean();
        return {
          ...JSON.parse(JSON.stringify(request)),
          sender: sender
            ? {
                userId: sender.userId,
                firstName: sender.firstName || "",
                lastName: sender.lastName || "",
                email: sender.email || "",
                profilePhoto: sender.profilePhoto || "/default-avatar.png",
                department: sender.department || "",
                description: sender.description || "",
                linkedInUrl: sender.linkedInUrl || "",
                graduationYear: sender.graduationYear || null,
              }
            : null,
        };
      })
    );

    return requestsWithUsers;
  } catch (error) {
    console.error("Error fetching connection requests:", error);
    return [];
  }
};

export const getMessages = async (otherUserId: string) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Not authenticated");
    const userId = session.user.id;

    const connection = await Connection.findOne({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
      status: "accepted",
    });

    if (!connection) throw new Error("Users are not connected");

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });

    return JSON.parse(JSON.stringify(messages));
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

export const getLastMessageTimesForCurrentUser = async () => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return [];
    const userId = session.user.id;

    const results = await Message.aggregate([
      { $match: { $or: [{ senderId: userId }, { receiverId: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$senderId", userId] }, "$receiverId", "$senderId"],
          },
          lastMessageDate: { $first: "$createdAt" },
          lastMessageContent: { $first: "$content" },
          lastMessageImage: { $first: "$imageUrl" },
          lastMessageSender: { $first: "$senderId" },
        },
      },
      {
        $lookup: {
          from: "conversationreadstatuses",
          let: { partnerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", userId] },
                    { $eq: ["$partnerId", "$$partnerId"] },
                  ],
                },
              },
            },
            { $project: { lastReadAt: 1 } },
          ],
          as: "readStatus",
        },
      },
      {
        $addFields: {
          isUnread: {
            $and: [
              { $ne: ["$lastMessageSender", userId] },
              {
                $gt: [
                  "$lastMessageDate",
                  {
                    $ifNull: [
                      { $arrayElemAt: ["$readStatus.lastReadAt", 0] },
                      new Date(0),
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          lastMessageDate: 1,
          lastMessageContent: 1,
          lastMessageImage: 1,
          lastMessageSender: 1,
          isUnread: 1,
        },
      },
      { $sort: { lastMessageDate: -1 } },
    ]);

    return results.map((r: any) => ({
      userId: r.userId as string,
      lastMessageDate: r.lastMessageDate,
      lastMessageContent: r.lastMessageContent ?? null,
      lastMessageImage: r.lastMessageImage ?? null,
      lastMessageSender: r.lastMessageSender ?? null,
      isUnread: !!r.isUnread,
    }));
  } catch (error) {
    console.error("Error in getLastMessageTimesForCurrentUser:", error);
    return [];
  }
};

// ─── Write Actions ────────────────────────────────────────────────────────────

export const createPostAction = async (inputText: string, selectedFile: string) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("User not authenticated");
    if (!inputText) throw new Error("Input field is required");

    const userObject = await createSafeUserObject(session.user.id);
    if (!userObject) throw new Error("User profile not found");

    let post;
    if (selectedFile) {
      const uploadResponse = await cloudinary.uploader.upload(selectedFile);
      post = await Post.create({
        description: inputText,
        user: userObject,
        imageUrl: uploadResponse.secure_url,
      });
    } else {
      post = await Post.create({
        description: inputText,
        user: userObject,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in createPostAction:", error);
    throw new Error(error.message || "Failed to create post");
  }
};

export const deletePostAction = async (postId: string) => {
  await connectDB();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("User not authenticated.");
  const userId = session.user.id;

  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found.");

  const userProfile = await User.findOne({ userId });
  if (post.user.userId !== userId && userProfile?.role !== "admin") {
    throw new Error("You are not the owner of this post.");
  }

  await Post.deleteOne({ _id: postId });
  revalidatePath("/");
};

export const createCommentAction = async (postId: string, commentText: string) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("User not authenticated");
    if (!commentText.trim()) throw new Error("Comment text is required");

    const userObject = await createSafeUserObject(session.user.id);
    if (!userObject) throw new Error("User profile not found");

    const post = await Post.findById(postId);
    if (!post) throw new Error("Post not found");

    const comment = await Comment.create({
      textMessage: commentText,
      user: userObject,
    });

    const typedComment = comment as unknown as { _id: Types.ObjectId };
    if (!post.comments) post.comments = [];
    post.comments.push(typedComment._id);
    await post.save();

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in createCommentAction:", error);
    throw new Error(error.message || "Failed to create comment");
  }
};

export const sendMessage = async (
  receiverId: string,
  content: string,
  imageUrl?: string
) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Not authenticated");
    const userId = session.user.id;

    const connection = await Connection.findOne({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId },
      ],
      status: "accepted",
    });

    if (!connection) throw new Error("Users are not connected");

    const message = await Message.create({
      senderId: userId,
      receiverId,
      content,
      imageUrl,
      createdAt: new Date(),
    });

    revalidatePath("/messages");
    return JSON.parse(JSON.stringify(message));
  } catch (error: any) {
    console.error("Error sending message:", error);
    throw new Error(error.message || "Failed to send message");
  }
};

export const sendConnectionRequest = async (receiverId: string) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Not authenticated");
    const userId = session.user.id;

    const existingConnection = await Connection.findOne({
      $or: [
        { senderId: userId, receiverId },
        { senderId: receiverId, receiverId: userId },
      ],
    });

    if (existingConnection) throw new Error("Connection already exists");

    await Connection.create({
      senderId: userId,
      receiverId,
      status: "pending",
    });

    revalidatePath("/people");
    revalidatePath("/messages");
    return { success: true };
  } catch (error: any) {
    console.error("Error sending connection request:", error);
    throw new Error(error.message || "Failed to send connection request");
  }
};

export const respondToConnectionRequest = async (
  connectionId: string,
  status: "accepted" | "rejected"
) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Not authenticated");
    const userId = session.user.id;

    const connection = await Connection.findById(connectionId);
    if (!connection) throw new Error("Connection request not found");
    if (connection.receiverId !== userId) throw new Error("Not authorized");

    connection.status = status;
    await connection.save();

    revalidatePath("/people");
    revalidatePath("/messages");
    return { success: true };
  } catch (error: any) {
    console.error("Error responding to connection request:", error);
    throw new Error(error.message || "Failed to respond to connection request");
  }
};

export const updateProfile = async (data: {
  firstName: string;
  lastName: string;
  description: string;
  graduationYear: number;
  linkedInUrl: string;
  githubUrl: string;
  profilePhoto: string;
  department?: string;
}) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Not authenticated");
    const userId = session.user.id;

    let imageUrl = data.profilePhoto;

    if (data.profilePhoto.startsWith("data:image")) {
      try {
        const result = await cloudinary.uploader.upload(data.profilePhoto, {
          folder: "alumni-profiles",
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        const existingUser = await User.findOne({ userId });
        imageUrl = existingUser?.profilePhoto || "/default-avatar.png";
      }
    }

    const profile = await User.findOneAndUpdate(
      { userId },
      {
        firstName: data.firstName,
        lastName: data.lastName,
        description: data.description,
        graduationYear: data.graduationYear,
        department: data.department || "",
        linkedInUrl: data.linkedInUrl,
        githubUrl: data.githubUrl,
        profilePhoto: imageUrl,
      },
      { new: true }
    );

    if (!profile) throw new Error("User not found");

    await Post.updateMany(
      { "user.userId": userId },
      {
        "user.firstName": data.firstName,
        "user.lastName": data.lastName,
        "user.profilePhoto": imageUrl,
      }
    );

    revalidatePath("/profile");
    revalidatePath("/");
    return JSON.parse(JSON.stringify(profile));
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
};

export const likePostAction = async (postId: string) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("User not authenticated");
    const userId = session.user.id;

    const result = await Post.findOneAndUpdate(
      { _id: postId },
      { $addToSet: { likes: userId } },
      { new: true }
    );

    if (!result) throw new Error("Post not found");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in likePostAction:", error);
    throw new Error(error.message || "Failed to like post");
  }
};

export const dislikePostAction = async (postId: string) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("User not authenticated");
    const userId = session.user.id;

    const result = await Post.findOneAndUpdate(
      { _id: postId },
      { $pull: { likes: userId } },
      { new: true }
    );

    if (!result) throw new Error("Post not found");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error in dislikePostAction:", error);
    throw new Error(error.message || "Failed to unlike post");
  }
};

export const uploadChatImage = async (imageData: string) => {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("User not authenticated");
    if (!imageData) throw new Error("No image data provided");

    const uploadResponse = await cloudinary.uploader.upload(imageData, {
      folder: "chat-images",
    });

    return uploadResponse.secure_url;
  } catch (error: any) {
    console.error("Error in uploadChatImage:", error);
    throw new Error(error.message || "Failed to upload image");
  }
};