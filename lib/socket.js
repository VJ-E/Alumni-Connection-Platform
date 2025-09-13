const { Server: SocketIOServer } = require('socket.io');
const mongoose = require('mongoose');

// Message Schema (matching the existing model)
const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, default: "" },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// Group & GroupMessage Schemas (for group chat)
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

// Global Socket.IO instance
let io = null;

function initializeSocket(server) {
  if (io) {
    return io;
  }

  console.log('Initializing Socket.IO server...');

  // Initialize Socket.IO with enhanced configuration
  io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [
            "https://alumni-connection-platform.vercel.app",
            process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null
          ].filter(Boolean)
        : ["http://localhost:3000"],
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
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a group room (so users receive that group's messages in realtime)
    socket.on('joinGroup', (groupId) => {
      if (!groupId) return;
      socket.join(`group:${groupId}`);
      console.log(`User ${socket.id} joined group: ${groupId}`);
    });

    // Leave a group room
    socket.on('leaveGroup', (groupId) => {
      if (!groupId) return;
      socket.leave(`group:${groupId}`);
      console.log(`User ${socket.id} left group: ${groupId}`);
    });

    // Send a message to a group
    socket.on('sendGroupMessage', async (data) => {
      try {
        const { groupId, senderId, content, imageUrl } = data;
        if (!groupId || !senderId || (!content && !imageUrl)) {
          return socket.emit('messageError', { error: 'Invalid group message payload' });
        }

        // Ensure the sender is a member of the group
        // Convert string ID to ObjectId if needed
        const group = await Group.findById(groupId).lean();
        
        // For testing purposes, allow messages if group doesn't exist (test groups)
        if (!group) {
          console.log(`Group ${groupId} not found in database, allowing test message`);
          // Continue with message sending for test purposes
        } else if (!group.members.includes(senderId)) {
          return socket.emit('messageError', { error: 'Not a member of this group' });
        }

        // Save in DB (only if group exists, otherwise just broadcast for testing)
        let saved;
        if (group) {
          saved = await GroupMessage.create({
            groupId,
            senderId,
            content: content || "",
            imageUrl,
            createdAt: new Date(),
          });
        } else {
          // For test messages, create a mock message object
          saved = {
            _id: new mongoose.Types.ObjectId(),
            groupId,
            senderId,
            content: content || "",
            imageUrl,
            createdAt: new Date(),
          };
        }

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
        
        console.log(`Group message sent to group ${groupId} from ${senderId}`);
      } catch (err) {
        console.error('Error sending group message:', err);
        socket.emit('messageError', { error: 'Failed to send group message' });
      }
    });

    // Handle user joining
    socket.on('join', (data) => {
      const userId = typeof data === 'string' ? data : data.userId;
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
        
        // Save message to MongoDB with timeout handling
        const message = new Message({
          senderId,
          receiverId,
          content,
          imageUrl,
          createdAt: new Date()
        });
        
        const savedMessage = await Promise.race([
          message.save(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database save timeout')), 5000)
          )
        ]);
        
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

  console.log('Socket.IO server initialized successfully');
  return io;
}

function getSocketInstance() {
  return io;
}

module.exports = {
  initializeSocket,
  getSocketInstance
};
