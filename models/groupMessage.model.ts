import mongoose, { Schema, models, model } from "mongoose";

export interface IGroupMessage {
  _id: string;
  groupId: mongoose.Schema.Types.ObjectId;
  senderId: string;         // Clerk user ID
  content?: string;
  imageUrl?: string;
  createdAt: Date;
}

const GroupMessageSchema = new Schema<IGroupMessage>({
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  senderId: { type: String, required: true },
  content: { type: String, default: "" },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const GroupMessage = models.GroupMessage || model<IGroupMessage>("GroupMessage", GroupMessageSchema);
export default GroupMessage;
