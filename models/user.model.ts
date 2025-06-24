import mongoose, { Document, Model } from "mongoose";

export interface IUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  description: string;
  graduationYear: number | null;
  role: 'student' | 'alumni';
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
  role: {
    type: String,
    enum: ['student', 'alumni'],
    default: 'student',
  },
}, { timestamps: true });

// Add a pre-save middleware to automatically set role based on graduation year
userSchema.pre('save', function(next) {
  if (this.graduationYear) {
    const currentYear = new Date().getFullYear();
    this.role = this.graduationYear <= currentYear ? 'alumni' : 'student';
  }
  next();
});

export const User: Model<IUserDocument> = mongoose.models.User || mongoose.model("User", userSchema);