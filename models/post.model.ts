import mongoose, { Document, Model } from "mongoose";
import { IUser } from "./user.model";
import { IComment } from "./comment.model";

export interface IPost {
  description: string;
  user: IUser;
  imageUrl?: string;
  likes?: string[];
  comments?: IComment[];
}

export interface IPostDocument extends IPost, Document {
  createdAt: Date;
  updatedAt: Date;
}

// ✅ Define user sub-schema separately
const userSubSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: false },
    email: { type: String, required: true },
    profilePhoto: { type: String, default: "/default-avatar.png" },
    description: { type: String, default: "" },
    graduationYear: { type: Number, default: null, required: false },
  },
  { _id: false }
);

// ✅ Main Post schema
const postSchema = new mongoose.Schema<IPostDocument>(
  {
    description: { type: String, required: true },
    user: { type: userSubSchema, required: true }, // 👍 Now clean
    imageUrl: { type: String, default: "" },
    likes: { type: [String], default: [] },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

export const Post: Model<IPostDocument> =
  mongoose.models?.Post || mongoose.model<IPostDocument>("Post", postSchema);
