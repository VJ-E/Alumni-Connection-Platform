import mongoose, { Document, Model } from "mongoose";

export interface IUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  description: string;
  graduationYear: number | null;
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUserDocument>({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  profilePhoto: {
    type: String,
    default: "/default-avatar.png",
  },
  description: {
    type: String,
    default: "",
  },
  graduationYear: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

export const User: Model<IUserDocument> = mongoose.models.User || mongoose.model("User", userSchema);