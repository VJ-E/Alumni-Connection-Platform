const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const mongoose = require('mongoose');
const { initializeSocket } = require('./lib/socket');

// Load environment variables
require('dotenv').config();

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// When using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Connect to MongoDB
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('Please define the MONGO_URI environment variable');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start the application
const startApp = async () => {
  try {
    await connectDB();
    await app.prepare();
    
    const httpServer = createServer(async (req, res) => {
      try {
        // Be sure to pass `true` as the second argument to `url.parse`.
        // This tells it to parse the query portion of the URL.
        const parsedUrl = parse(req.url, true);
        const { pathname, query } = parsedUrl;

        if (pathname === '/api/socket') {
          // Handle Socket.IO requests
          await handle(req, res, parsedUrl);
        } else {
          await handle(req, res, parsedUrl);
        }
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });

        // Initialize Socket.IO and get the instance
    const io = initializeSocket(httpServer);

    // Handle WebSocket upgrade requests
    httpServer.on('upgrade', (req, socket, head) => {
      const { pathname } = parse(req.url, true);
      
      // Handle Socket.IO WebSocket upgrade
      if (pathname === '/api/socket.io/') {
        io.engine.handleUpgrade(req, socket, head, (ws) => {
          io.engine.onWebSocket(req, ws);
        });
      } else {
        // Close the connection if the path is not recognized
        socket.destroy();
      }
    });

    httpServer
      .once('error', (err) => {
        console.error('HTTP server error:', err);
        process.exit(1);
      })
      .listen(port, () => {
        console.log(`> Server running on http://${hostname}:${port}`);
        console.log('> WebSocket endpoint: ws://' + hostname + ':' + port + '/api/socket.io/');
      });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startApp();