const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Enable CORS with specific options
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://alumni-connection-platform.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Initialize Socket.IO with enhanced configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL ? 
      process.env.FRONTEND_URL.split(',') : 
      "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  pingTimeout: 10000,
  pingInterval: 25000,
  cookie: false,
  maxHttpBufferSize: 1e8, // 100MB
  serveClient: false,
  // Add path to match client configuration
  path: '/socket.io/',
  // Add connection state recovery
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Debug logging for HTTP upgrade
server.on('upgrade', (req, socket, head) => {
  console.log('HTTP upgrade requested:', req.url);
  console.log('Upgrade headers:', JSON.stringify(req.headers, null, 2));
});

// Socket.IO engine error handling
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', err);
});

// Socket.IO upgrade error handling
io.engine.on('upgrade_error', (err) => {
  console.error('Socket.IO upgrade error:', err);
});

app.use(express.json());

// MongoDB connection with better error handling
const connectDB = async () => {
  const maxRetries = 5;
  let retryCount = 0;
  
  const connectWithRetry = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni-platform', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Updated MongoDB connection options for newer MongoDB driver
        maxPoolSize: 10,
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        }
      });
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      retryCount++;
      
      if (retryCount < maxRetries) {
        console.log(`Retrying MongoDB connection (${retryCount}/${maxRetries})...`);
        setTimeout(connectWithRetry, 5000);
      } else {
        console.error('Max MongoDB connection retries reached. Exiting...');
        process.exit(1);
      }
    }
  };
  
  await connectWithRetry();
};

// Start server after MongoDB connection is established
const startApp = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Socket.IO server running on port ${PORT}`);
      console.log('WebSocket path: /socket.io/');
      console.log('Allowed origins:', process.env.FRONTEND_URL || 'http://localhost:3000');
    });
    
    server.on('error', (error) => {
      console.error('Server error:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startApp();

// Message Schema (matching the existing model)
const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, default: "" },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

// --- Group & GroupMessage Schemas (for group chat) ---
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  members: [{ type: String, required: true }],  // Clerk user IDs
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const GroupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  senderId: { type: String, required: true },
  content: { type: String, default: "" },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Group = mongoose.models.Group || mongoose.model('Group', GroupSchema);
const GroupMessage = mongoose.models.GroupMessage || mongoose.model('GroupMessage', GroupMessageSchema);



// Store active users and their socket connections
const activeUsers = new Map();

// Connection state recovery
const socketIdToUserId = new Map();
const userIdToSocketId = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  // Join a group room (so users receive that group's messages in realtime)
  socket.on('joinGroup', (groupId) => {
    if (!groupId) return;
    socket.join(`group:${groupId}`);
  });

  // Leave a group room
  socket.on('leaveGroup', (groupId) => {
    if (!groupId) return;
    socket.leave(`group:${groupId}`);
  });

  // Send a message to a group
  socket.on('sendGroupMessage', async (data) => {
    try {
      const { groupId, senderId, content, imageUrl } = data;
      if (!groupId || !senderId || (!content && !imageUrl)) {
        return socket.emit('messageError', { error: 'Invalid group message payload' });
      }

      // Ensure the sender is a member of the group
      const group = await Group.findById(groupId).lean();
      if (!group) {
        return socket.emit('messageError', { error: 'Group not found' });
      }
      if (!group.members.includes(senderId)) {
        return socket.emit('messageError', { error: 'Not a member of this group' });
      }

      // Save in DB
      const saved = await GroupMessage.create({
        groupId,
        senderId,
        content: content || "",
        imageUrl,
        createdAt: new Date(),
      });

      const messageToSend = {
        _id: saved._id,
        groupId: saved.groupId,
        senderId: saved.senderId,
        content: saved.content,
        imageUrl: saved.imageUrl,
        createdAt: saved.createdAt,
      };

      // Emit to everyone in that group room
      io.to(`group:${groupId}`).emit('newGroupMessage', messageToSend);

      // Also confirm back to sender (useful for optimistic UI)
      socket.emit('groupMessageConfirmed', messageToSend);
    } catch (err) {
      console.error('Error sending group message:', err);
      socket.emit('messageError', { error: 'Failed to send group message' });
    }
  });

  // Handle user joining
  socket.on('join', (userId) => {
    console.log(`User ${userId} joined with socket ${socket.id}`);
    activeUsers.set(userId, socket.id);
    socket.userId = userId;
    
    // Join user to their personal room
    socket.join(userId);
  });

  // Handle sending messages
  socket.on('sendMessage', async (messageData) => {
    try {
      const { senderId, receiverId, content, imageUrl } = messageData;
      
      // Save message to MongoDB
      const message = new Message({
        senderId,
        receiverId,
        content,
        imageUrl,
        createdAt: new Date()
      });
      
      const savedMessage = await message.save();
      
      // Send message to both sender and receiver
      const messageToSend = {
        _id: savedMessage._id,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        content: savedMessage.content,
        imageUrl: savedMessage.imageUrl,
        createdAt: savedMessage.createdAt
      };
      
      // Send to receiver if they're online
      socket.to(receiverId).emit('newMessage', messageToSend);
      
      // Send confirmation back to sender
      socket.emit('messageConfirmed', messageToSend);
      
      console.log(`Message sent from ${senderId} to ${receiverId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Handle user typing
  socket.on('typing', (data) => {
    socket.to(data.receiverId).emit('userTyping', {
      senderId: data.senderId,
      isTyping: data.isTyping
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    if (socket.userId) {
      activeUsers.delete(socket.userId);
      // Clean up connection tracking
      const socketId = userIdToSocketId.get(socket.userId);
      if (socketId === socket.id) {
        userIdToSocketId.delete(socket.userId);
        socketIdToUserId.delete(socket.id);
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get active users count
app.get('/active-users', (req, res) => {
  res.json({ count: activeUsers.size, users: Array.from(activeUsers.keys()) });
});

// This duplicate startApp function has been removed
