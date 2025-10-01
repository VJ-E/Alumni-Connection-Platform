const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alumni-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Message Schema (matching the existing model)
const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String, default: "" },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', MessageSchema);

// Store active users and their socket connections
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      activeUsers.delete(socket.userId);
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
