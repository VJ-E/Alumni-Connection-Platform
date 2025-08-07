import mongoose, { Model } from "mongoose";

const connectionSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: [true, 'SenderId is required'],
      index: true,
    },
    receiverId: {
      type: String,
      required: [true, 'ReceiverId is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
    },
  },
  { 
    timestamps: true,
    validateBeforeSave: true
  }
);

// Add a pre-save hook to validate the data
connectionSchema.pre('save', function(next) {
  if (!this.senderId || !this.receiverId) {
    next(new Error('SenderId and ReceiverId are required and cannot be null'));
    return;
  }
  if (this.senderId === this.receiverId) {
    next(new Error('SenderId and ReceiverId cannot be the same'));
    return;
  }
  next();
});

export interface IConnection extends mongoose.Document {
  senderId: string;
  receiverId: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

// Initialize the model with proper indexes
const Connection = mongoose.models.Connection || mongoose.model<IConnection>("Connection", connectionSchema);

// Create indexes after model initialization
Connection.collection.createIndex(
  { senderId: 1, receiverId: 1 },
  { 
    unique: true,
    background: true,
    name: 'unique_sender_receiver'
  }
).catch(error => {
  console.error('Error creating index:', error);
});

export { Connection }; 