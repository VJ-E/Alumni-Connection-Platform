import mongoose from 'mongoose';

export interface IMessage {
    _id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: Date;
}

const messageSchema = new mongoose.Schema({
    senderId: {
        type: String,
        required: true
    },
    receiverId: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema); 