import mongoose from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    receiverId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Ensure unique connections between users
connectionSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

export interface IConnection extends mongoose.Document {
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

export const Connection = mongoose.models.Connection || mongoose.model("Connection", connectionSchema); 