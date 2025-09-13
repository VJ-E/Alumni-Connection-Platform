// This file is required for Socket.IO to work with Next.js API routes in production
import { Server } from 'socket.io';

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Initializing Socket.IO server in API route');
    
    // Get the HTTP server instance
    const httpServer = res.socket.server;
    
    // Create Socket.IO server
    const io = new Server(httpServer, {
      path: '/api/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [
              "https://alumni-connection-platform.vercel.app",
              process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
              process.env.RAILWAY_PUBLIC_DOMAIN ? `http://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null
            ].filter(Boolean)
          : ["http://localhost:3000"],
        methods: ["GET", "POST", "OPTIONS"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    // Store the io instance
    res.socket.server.io = io;

    // Log new connections
    io.on('connection', (socket) => {
      console.log(`New client connected: ${socket.id}`);
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }
  
  // End the response
  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
