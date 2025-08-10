import mongoose, { Schema, Document } from "mongoose";

export interface IConversationReadStatus extends Document {
  userId: string;
  partnerId: string;
  lastReadAt: Date;
}

const ConversationReadStatusSchema = new Schema<IConversationReadStatus>({
  userId: { type: String, required: true },
  partnerId: { type: String, required: true },
  lastReadAt: { type: Date, default: Date.now }
});

export default mongoose.models.ConversationReadStatus ||
  mongoose.model<IConversationReadStatus>(
    "ConversationReadStatus",
    ConversationReadStatusSchema
  );
