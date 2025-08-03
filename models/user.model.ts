import mongoose, { Document, Model, Types } from "mongoose";

export type Department = 'CSE(AI&ML)' | 'CSE' | 'CSBS' | 'AI&DS' | '';

export interface IUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhoto: string;
  description: string;
  graduationYear: number | null;
  department: Department;
  // major: string;
  role: 'student' | 'alumni' | 'admin';
  linkedInUrl?: string;
  githubUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  __v: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
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
  department: {
    type: String,
    enum: ['CSE(AI&ML)', 'CSE', 'CSBS', 'AI&DS'],
    default: '',
  },
  role: {
    type: String,
    enum: ['student', 'alumni', 'admin'],
    default: 'student',
  },
  linkedInUrl: {
    type: String,
    default: "",
  },
  githubUrl: {
    type: String,
    default: "",
  },
}, { timestamps: true });

// Function to determine role based on graduation year
function determineRole(graduationYear: number | null): 'student' | 'alumni' | 'admin' {
  if (!graduationYear) return 'student';
  const currentYear = new Date().getFullYear();
  return graduationYear <= currentYear ? 'alumni' : 'student';
}

// Add middleware to set role based on graduation year before saving
userSchema.pre('save', function(next) {
  if (this.graduationYear && this.role !== 'admin') {
    this.role = determineRole(this.graduationYear);
  }
  next();
});

// Add middleware for findOneAndUpdate
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update?.graduationYear) {
    update.role = determineRole(update.graduationYear);
  }
  next();
});

// Add middleware for find operations to ensure role is always up to date
userSchema.post('find', async function(docs) {
  if (!Array.isArray(docs)) return;
  
  const currentYear = new Date().getFullYear();
  const updates = docs.map(doc => {
    if (!doc.graduationYear) return null;
    
    const calculatedRole = determineRole(doc.graduationYear);
    if (doc.role !== calculatedRole && doc.role !== 'admin') {
      return User.findByIdAndUpdate(doc._id, { role: calculatedRole });
    }
    return null;
  }).filter(Boolean);
  
  if (updates.length > 0) {
    await Promise.all(updates);
  }
});

// Add middleware for findOne operations
userSchema.post('findOne', async function(doc) {
  if (!doc) return;
  
  const calculatedRole = determineRole(doc.graduationYear);
  if (doc.role !== calculatedRole && doc.role !== 'admin') {
    await User.findByIdAndUpdate(doc._id, { role: calculatedRole });
  }
});

export const User: Model<IUserDocument> = mongoose.models.User || mongoose.model("User", userSchema);