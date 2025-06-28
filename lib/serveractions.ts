"use server"

import { Post } from "@/models/post.model";
import { IUser, User } from "@/models/user.model";
import { Message } from "@/models/message.model";
import { Connection } from "@/models/connection.model";
import { currentUser } from "@clerk/nextjs/server"
import { v2 as cloudinary } from 'cloudinary';
import connectDB from "./db";
import { revalidatePath } from "next/cache";
import { Comment, ICommentDocument } from "@/models/comment.model";
import { Types } from "mongoose";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const createUserObject = async (user: any) => {
    await connectDB();
    // Get user profile from database to get graduation year
    const userProfile = await User.findOne({ userId: user.id });
    
    return {
        userId: user.id,
        firstName: user.firstName || "Unknown User",
        lastName: user.lastName || " ",
        email: user.emailAddresses[0]?.emailAddress || "",
        profilePhoto: user.imageUrl || "/default-avatar.png",
        description: userProfile?.description || "",
        graduationYear: userProfile?.graduationYear || new Date().getFullYear(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};

interface SafeUser {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhoto: string;
    description: string;
    graduationYear: number | null;
    role: string;
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

// Helper function to safely serialize any MongoDB document
const serializeDocument = (doc: any): SafePost | null => {
    if (!doc) return null;
    const plainDoc = { ...doc };
    
    // Convert _id to string
    if (plainDoc._id) {
        plainDoc._id = plainDoc._id.toString();
    }
    
    // Convert user data to safe format
    if (plainDoc.user) {
        plainDoc.user = {
            userId: plainDoc.user.userId || "",
            firstName: plainDoc.user.firstName || "",
            lastName: plainDoc.user.lastName || "",
            email: plainDoc.user.email || "",
            profilePhoto: plainDoc.user.profilePhoto || "/default-avatar.png",
            description: plainDoc.user.description || "",
            graduationYear: plainDoc.user.graduationYear || null,
            role: plainDoc.user.role || "student"
        };
    }
    
    // Convert comments to safe format
    if (Array.isArray(plainDoc.comments)) {
        plainDoc.comments = plainDoc.comments.map((comment: any) => ({
            _id: comment._id?.toString() || "",
            textMessage: comment.textMessage || "",
            user: comment.user ? {
                userId: comment.user.userId || "",
                firstName: comment.user.firstName || "",
                lastName: comment.user.lastName || "",
                email: comment.user.email || "",
                profilePhoto: comment.user.profilePhoto || "/default-avatar.png",
                description: comment.user.description || "",
                graduationYear: comment.user.graduationYear || null,
                role: comment.user.role || "student"
            } : null,
            createdAt: comment.createdAt?.toString() || new Date().toISOString(),
            updatedAt: comment.updatedAt?.toString() || new Date().toISOString()
        }));
    }
    
    // Remove mongoose internal fields
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
        updatedAt: plainDoc.updatedAt?.toString() || new Date().toISOString()
    };
};

// get all post using server actions
export const getAllPosts = async (): Promise<SafePost[]> => {
    try {
        await connectDB();
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({ 
                path: 'comments', 
                options: { sort: { createdAt: -1 } }
            })
            .lean()
            .exec();
        
        if(!posts) return [];
        
        // For each post, get the latest user data
        const postsWithUpdatedUserData = await Promise.all(posts.map(async (post) => {
            try {
                // Get the latest user data
                const userProfile = await User.findOne({ userId: post.user?.userId }).lean();
                if (userProfile) {
                    // Keep all existing user data and only update graduationYear
                    post.user = {
                        userId: post.user.userId,
                        firstName: post.user.firstName,
                        lastName: post.user.lastName,
                        email: post.user.email,
                        profilePhoto: post.user.profilePhoto,
                        description: post.user.description || "",
                        graduationYear: userProfile.graduationYear,
                        role: userProfile.role || "student"
                    };
                }
                return post;
            } catch (error) {
                console.error('Error updating user data for post:', error);
                // Return original post if there's an error
                return post;
            }
        }));
        
        // Safely serialize all posts and their nested data
        const safePosts = postsWithUpdatedUserData
            .filter(post => post && post.user) // Make sure we have valid posts with user data
            .map(post => serializeDocument(post))
            .filter((post): post is SafePost => post !== null);
        
        return safePosts;
        
    } catch (error) {
        console.error('Error in getAllPosts:', error);
        return [];
    }
}

// Helper function to create a safe user object for posts/comments
const createSafeUserObject = async (user: any): Promise<SafeUser | null> => {
    if (!user) return null;
    
    await connectDB();
    const userProfile = await User.findOne({ userId: user.id }).lean();
    if (!userProfile) return null;
    
    // Determine role based on graduation year
    const currentYear = new Date().getFullYear();
    const role = userProfile.graduationYear && userProfile.graduationYear <= currentYear ? 'alumni' : 'student';
    
    return {
        userId: userProfile.userId,
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
        profilePhoto: userProfile.profilePhoto || "/default-avatar.png",
        description: userProfile.description || "",
        graduationYear: userProfile.graduationYear || null,
        role: userProfile.role || role // Use stored role or calculate it
    };
};

// creating post using server actions
export const createPostAction = async (inputText: string, selectedFile: string) => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) throw new Error('User not authenticated');
        if (!inputText) throw new Error('Input field is required');

        // Get user data using the helper function
        const userObject = await createSafeUserObject(user);
        if (!userObject) throw new Error('User profile not found');
        
        let post;
        if (selectedFile) {
            const uploadResponse = await cloudinary.uploader.upload(selectedFile);
            post = await Post.create({
                description: inputText,
                user: userObject,
                imageUrl: uploadResponse.secure_url
            });
        } else {
            post = await Post.create({
                description: inputText,
                user: userObject
            });
        }
        
        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error('Error in createPostAction:', error);
        throw new Error(error.message || 'Failed to create post');
    }
}

// delete post by id
export const deletePostAction = async (postId: string) => {
    await connectDB();
    const user = await currentUser();
    if (!user) throw new Error('User not authenticated.');
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found.');

    // keval apni hi post delete kr payega.
    if (post.user.userId !== user.id) {
        throw new Error('You are not an owner of this Post.');
    }
    try {
        await Post.deleteOne({ _id: postId });
        revalidatePath("/");
    } catch (error: any) {
        throw new Error('An error occurred', error);
    }
}

// Create a comment
export const createCommentAction = async (postId: string, commentText: string) => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) throw new Error('User not authenticated');
        if (!commentText.trim()) throw new Error('Comment text is required');

        const userDatabase = await createSafeUserObject(user);
        if (!userDatabase) throw new Error('Failed to create user object');

        const post = await Post.findById(postId);
        if (!post) throw new Error('Post not found');

        // Create the comment with proper typing
        const commentData = {
            textMessage: commentText,
            user: userDatabase
        };

        const comment = await Comment.create(commentData);
        const typedComment = comment as unknown as { _id: Types.ObjectId };

        // Add comment reference to post
        if (!post.comments) {
            post.comments = [];
        }
        
        post.comments.push(typedComment._id);
        await post.save();

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error('Error in createCommentAction:', error);
        throw new Error(error.message || 'Failed to create comment');
    }
};

// get all users using server actions
export const getAllUsers = async () => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) return [];

        // First ensure current user's profile exists
        await getUserProfile();

        // Get all users
        const users = await User.find({}).exec();
        
        // Transform users to safe format
        const transformedUsers = users.map(user => ({
            userId: user.userId,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            profilePhoto: user.profilePhoto || "/default-avatar.png",
            description: user.description || "",
            graduationYear: user.graduationYear || null,
            role: user.role
        }));

        return transformedUsers;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

// Get connected users (for now, return all users except current user)
export const getConnectedUsers = async () => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) return [];

        const connections = await Connection.find({
            $or: [
                { senderId: user.id },
                { receiverId: user.id }
            ],
            status: 'accepted'
        });

        const connectedUserIds = connections.map(conn => 
            conn.senderId === user.id ? conn.receiverId : conn.senderId
        );

        const users = await User.find({
            userId: { $in: connectedUserIds }
        }).lean();

        // Transform user data to match expected format
        const transformedUsers = users.map(user => ({
            userId: user.userId,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            profilePhoto: user.profilePhoto || "/default-avatar.png",
            description: user.description || "",
            graduationYear: user.graduationYear || null,
            role: user.role || "student"
        }));

        return JSON.parse(JSON.stringify(transformedUsers));
    } catch (error) {
        console.error('Error fetching connected users:', error);
        return [];
    }
}

// Get user by ID
export const getUserById = async (userId: string) => {
    try {
        await connectDB();
        const user = await User.findOne({ userId }).lean();
        if (!user) return null;
        
        return {
            userId: user.userId,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            profilePhoto: user.profilePhoto || "/default-avatar.png",
            description: user.description || "",
            graduationYear: user.graduationYear || null,
            role: user.role || "student"
        };
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Get messages between users
export const getMessages = async (otherUserId: string) => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        // Check if users are connected
        const connection = await Connection.findOne({
            $or: [
                { senderId: user.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: user.id }
            ],
            status: 'accepted'
        });

        if (!connection) {
            throw new Error('Users are not connected');
        }

        const messages = await Message.find({
            $or: [
                { senderId: user.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: user.id }
            ]
        }).sort({ createdAt: 1 });

        return JSON.parse(JSON.stringify(messages));
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

// Send a message
export async function sendMessage(receiverId: string, content: string, imageUrl?: string) {
    try {
        await connectDB();
        const sender = await currentUser();
        if (!sender) throw new Error('Not authenticated');

        // Check if users are connected
        const connection = await Connection.findOne({
            $or: [
                { senderId: sender.id, receiverId },
                { senderId: receiverId, receiverId: sender.id }
            ],
            status: 'accepted'
        });

        if (!connection) {
            throw new Error('Users are not connected');
        }

        const message = await Message.create({
            senderId: sender.id,
            receiverId,
            content,
            imageUrl, // add this field to your model
            createdAt: new Date(),
        });

        revalidatePath('/messages');
        return JSON.parse(JSON.stringify(message));
    } catch (error: any) {
        console.error('Error sending message:', error);
        throw new Error(error.message || 'Failed to send message');
    }
}

// Send connection request
export const sendConnectionRequest = async (receiverId: string) => {
    try {
        await connectDB();
        const sender = await currentUser();
        if (!sender) throw new Error('Not authenticated');

        // Check if connection already exists
        const existingConnection = await Connection.findOne({
            $or: [
                { senderId: sender.id, receiverId },
                { senderId: receiverId, receiverId: sender.id }
            ]
        });

        if (existingConnection) {
            throw new Error('Connection already exists');
        }

        await Connection.create({
            senderId: sender.id,
            receiverId,
            status: 'pending'
        });

        revalidatePath('/people');
        revalidatePath('/messages');
        return { success: true };
    } catch (error: any) {
        console.error('Error sending connection request:', error);
        throw new Error(error.message || 'Failed to send connection request');
    }
}

// Get connection requests for current user
export const getConnectionRequests = async () => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) return [];

        const requests = await Connection.find({
            receiverId: user.id,
            status: 'pending'
        }).sort({ createdAt: -1 });

        // Get sender details for each request
        const requestsWithUsers = await Promise.all(
            requests.map(async (request) => {
                const sender = await User.findOne({ userId: request.senderId }).lean();
                return {
                    ...JSON.parse(JSON.stringify(request)),
                    sender: sender ? {
                        userId: sender.userId,
                        firstName: sender.firstName || "",
                        lastName: sender.lastName || "",
                        email: sender.email || "",
                        profilePhoto: sender.profilePhoto || "/default-avatar.png",
                        description: sender.description || "",
                        graduationYear: sender.graduationYear || null
                    } : null
                };
            })
        );

        return requestsWithUsers;
    } catch (error) {
        console.error('Error fetching connection requests:', error);
        return [];
    }
}

// Accept or reject connection request
export const respondToConnectionRequest = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        const connection = await Connection.findById(connectionId);
        if (!connection) throw new Error('Connection request not found');
        if (connection.receiverId !== user.id) throw new Error('Not authorized');

        connection.status = status;
        await connection.save();

        revalidatePath('/people');
        revalidatePath('/messages');
        return { success: true };
    } catch (error: any) {
        console.error('Error responding to connection request:', error);
        throw new Error(error.message || 'Failed to respond to connection request');
    }
}

// Check connection status between users
export const getConnectionStatus = async (otherUserId: string) => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) return null;

        const connection = await Connection.findOne({
            $or: [
                { senderId: user.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: user.id }
            ]
        });

        return connection ? connection.status : null;
    } catch (error) {
        console.error('Error checking connection status:', error);
        return null;
    }
}

// Get user profile
export const getUserProfile = async () => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) {
            console.log('No authenticated user found');
            return null;
        }

        // Find existing profile
        let profile = await User.findOne({ userId: user.id });
        console.log('Existing profile:', profile);

        // If profile doesn't exist, create it with Clerk data
        if (!profile) {
            console.log('Creating new profile for user:', user.id);
            const currentYear = new Date().getFullYear();
            const userData = {
                userId: user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.emailAddresses[0]?.emailAddress || '',
                profilePhoto: user.imageUrl || '/default-avatar.png',
                description: '',
                graduationYear: currentYear, // Default to current year
                role: 'student' as const // Explicitly type as 'student'
            };
            console.log('New user data:', userData);
            
            try {
                profile = await User.create(userData);
                console.log('Created new profile:', profile);
            } catch (createError) {
                console.error('Error creating user profile:', createError);
                // If creation fails, try to find again (handle race condition)
                profile = await User.findOne({ userId: user.id });
                if (!profile) {
                    throw createError;
                }
            }
        }

        // Ensure role is set correctly based on graduation year
        const currentYear = new Date().getFullYear();
        const calculatedRole = profile.graduationYear && profile.graduationYear <= currentYear ? 'alumni' as const : 'student' as const;
        
        if (profile.role !== calculatedRole) {
            profile.role = calculatedRole;
            await profile.save();
            console.log('Updated user role to:', calculatedRole);
        }

        // Convert to plain object and return
        const profileData = {
            userId: profile.userId,
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            email: profile.email || '',
            profilePhoto: profile.profilePhoto || '/default-avatar.png',
            description: profile.description || '',
            graduationYear: profile.graduationYear || null,
            role: calculatedRole
        };
        
        console.log('Returning profile data:', profileData);
        return profileData;
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        throw new Error('Failed to get or create user profile');
    }
}

// Update user profile
export const updateProfile = async (data: {
    firstName: string;
    lastName: string;
    description: string;
    graduationYear: number;
    profilePhoto: string;
}) => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) throw new Error('Not authenticated');

        let imageUrl = data.profilePhoto;

        // If the image is a base64 string, upload it to Cloudinary
        if (data.profilePhoto.startsWith('data:image')) {
            try {
                const result = await cloudinary.uploader.upload(data.profilePhoto, {
                    folder: 'alumni-profiles',
                });
                imageUrl = result.secure_url;
            } catch (uploadError) {
                console.error('Error uploading to Cloudinary:', uploadError);
                // Keep the existing image URL if upload fails
                const existingUser = await User.findOne({ userId: user.id });
                imageUrl = existingUser?.profilePhoto || '/default-avatar.png';
            }
        }

        // Find and update or create new profile
        let profile = await User.findOne({ userId: user.id });
        if (profile) {
            profile = await User.findOneAndUpdate(
                { userId: user.id },
                {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    description: data.description,
                    graduationYear: data.graduationYear,
                    profilePhoto: imageUrl,
                },
                { new: true }
            );
        } else {
            profile = await User.create({
                userId: user.id,
                firstName: data.firstName,
                lastName: data.lastName,
                description: data.description,
                graduationYear: data.graduationYear,
                profilePhoto: imageUrl,
                email: user.emailAddresses[0]?.emailAddress || '',
            });
        }

        // Update user info in posts
        await Post.updateMany(
            { 'user.userId': user.id },
            {
                'user.firstName': data.firstName,
                'user.lastName': data.lastName,
                'user.profilePhoto': imageUrl,
            }
        );

        revalidatePath('/profile');
        revalidatePath('/');
        return JSON.parse(JSON.stringify(profile));
    } catch (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile');
    }
}

// Like a post
export const likePostAction = async (postId: string) => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) throw new Error('User not authenticated');

        // Use findOneAndUpdate to atomically update the likes array
        const result = await Post.findOneAndUpdate(
            { _id: postId },
            { $addToSet: { likes: user.id } },
            { new: true }
        );

        if (!result) throw new Error('Post not found');

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error('Error in likePostAction:', error);
        throw new Error(error.message || 'Failed to like post');
    }
};

// Dislike (unlike) a post
export const dislikePostAction = async (postId: string) => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) throw new Error('User not authenticated');

        // Use findOneAndUpdate to atomically update the likes array
        const result = await Post.findOneAndUpdate(
            { _id: postId },
            { $pull: { likes: user.id } },
            { new: true }
        );

        if (!result) throw new Error('Post not found');

        revalidatePath("/");
        return { success: true };
    } catch (error: any) {
        console.error('Error in dislikePostAction:', error);
        throw new Error(error.message || 'Failed to unlike post');
    }
};

// Upload chat image
export const uploadChatImage = async (imageData: string) => {
    try {
        await connectDB();
        const user = await currentUser();
        if (!user) throw new Error('User not authenticated');

        if (!imageData) throw new Error('No image data provided');
        
        const uploadResponse = await cloudinary.uploader.upload(imageData, {
            folder: 'chat-images'
        });
        
        return uploadResponse.secure_url;
    } catch (error: any) {
        console.error('Error in uploadChatImage:', error);
        throw new Error(error.message || 'Failed to upload image');
    }
}