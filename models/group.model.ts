import mongoose, { Schema, models, model } from "mongoose";

export interface IGroup {
  _id: string;
  name: string;
  imageUrl?: string;
  members: string[];        // Clerk user IDs
  createdBy: string;        // Clerk user ID of creator
  createdAt: Date;
}

const GroupSchema = new Schema<IGroup>({
  name: { type: String, required: true },
  imageUrl: { type: String },
  members: [{ type: String, required: true }],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Group = models.Group || model<IGroup>("Group", GroupSchema);
export default Group;
