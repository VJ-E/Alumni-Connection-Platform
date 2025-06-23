import mongoose, { Document, Model } from "mongoose";
import { IUser } from "./user.model";

export interface IComment {
    textMessage: string;
    user: IUser;
}

export interface ICommentDocument extends IComment, Document {
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new mongoose.Schema<ICommentDocument>({
    textMessage: {
        type: String,
        required: true
    },
    user: {
        userId: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        profilePhoto: {
            type: String,
            default: "/default-avatar.png"
        },
        description: {
            type: String,
            default: ""
        },
        graduationYear: {
            type: Number,
            default: null
        }
    }
}, { timestamps: true });

export const Comment: Model<ICommentDocument> = mongoose.models?.Comment || mongoose.model("Comment", commentSchema);