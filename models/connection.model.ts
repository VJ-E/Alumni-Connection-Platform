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

// Drop old indexes and create new ones
const initializeIndexes = async () => {
  try {
    const model = mongoose.model<IConnection>("Connection", connectionSchema);
    const collection = model.collection;
    
    // Drop old indexes if they exist
    try {
      await collection.dropIndex('userId_1_peerId_1');
    } catch (e) {
      // Ignore error if index doesn't exist
    }

    // Create new compound index
    await collection.createIndex(
      { senderId: 1, receiverId: 1 },
      { 
        unique: true,
        background: true,
        name: 'unique_sender_receiver'
      }
    );

    return model;
  } catch (error) {
    console.error('Error initializing indexes:', error);
    throw error;
  }
};

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
let Connection: Model<IConnection>;
try {
  // Try to get the existing model
  Connection = mongoose.model<IConnection>("Connection");
  // Initialize indexes for existing model
  initializeIndexes().catch(console.error);
} catch (error) {
  // Model doesn't exist, create and initialize it
  initializeIndexes()
    .then(model => {
      Connection = model;
    })
    .catch(console.error);
}

export { Connection }; 