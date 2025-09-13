"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

// Use dynamic import for socket.io-client to avoid type issues
const io = require('socket.io-client');

// Define types for our socket instance and context
interface SocketContextType {
  socket: any; // Using any to avoid type issues with socket.io-client
  isConnected: boolean;
}

// Create the context with default values
export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext).socket;
export const useSocketConnection = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { userId, isLoaded } = useAuth();
  const socketRef = useRef<any>(null);
  const connectionAttempts = useRef(0);
  const maxConnectionAttempts = 3;

  useEffect(() => {
    if (!isLoaded || !userId) {
      // Clean up existing socket if user is not authenticated
      if (socketRef.current) {
        console.log('User not authenticated, cleaning up socket');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Prevent multiple connections
    if (socketRef.current && socketRef.current.connected) {
      console.log('Socket already connected, skipping initialization');
      return;
    }

    // Limit connection attempts
    if (connectionAttempts.current >= maxConnectionAttempts) {
      console.log('Max connection attempts reached, skipping socket connection');
      return;
    }

    // Get the WebSocket URL from environment or use relative URL
    const wsProtocol = typeof window !== 'undefined' ? 
      (window.location.protocol === 'https:' ? 'wss:' : 'ws:') : 'ws:';
    const wsHost = typeof window !== 'undefined' ? 
      window.location.host : 'localhost:3000';
    
    // Socket.IO connection options
    const socketOptions = {
      path: '/api/socket.io', // Match the server path
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10, // Increased from 5 to 10
      reconnectionDelay: 1000, // Start with 1s delay
      reconnectionDelayMax: 10000, // Max 10s delay
      timeout: 30000, // Increased from 20000 to 30000
      forceNew: true, // Changed to true to ensure fresh connections
      autoConnect: true,
      // Use secure based on current protocol
      secure: typeof window !== 'undefined' ? window.location.protocol === 'https:' : false,
      // Add authentication in auth object
      auth: {
        token: userId,
        userId: userId,
        timestamp: Date.now()
      },
      // Add query parameters for identification
      query: {
        clientType: 'web',
        version: '1.0.0',
        _: Date.now() // Cache buster
      },
      // Enable credentials for CORS
      withCredentials: true,
      // Increase timeouts for production
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      // Disable auto-upgrade to WebSocket
      // Let the client and server negotiate the best transport
      // Remove wsEngine as it's not needed and can cause issues
      // Add connection state recovery
      connectionStateRecovery: {
        maxDisconnectionDuration: 5 * 60 * 1000, // 5 minutes
        skipMiddlewares: true
      },
      // Add per-message deflate compression
      perMessageDeflate: {
        threshold: 1024, // Size threshold in bytes for compression
        zlibDeflateOptions: {
          level: 3 // Compression level (0-9, where 9 is maximum compression)
        },
        zlibInflateOptions: {
          chunkSize: 10 * 1024 // 10KB chunks
        }
      },
      // Enable debug logging in development
      debug: process.env.NODE_ENV !== 'production',
      // Add a connection timeout
      connectTimeout: 10000 // 10 seconds
    };
    
    // Determine the WebSocket URL based on environment
    const wsUrl = (() => {
      if (typeof window !== 'undefined') {
        // In the browser, use the current host
        return window.location.host;
      }
      // For server-side rendering or testing
      return process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_VERCEL_URL || 'alumni-connection-platform.vercel.app'
        : 'localhost:3000';
    })();

    // Determine the protocol (ws or wss)
    const protocol = typeof window !== 'undefined' 
      ? window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      : 'ws:';

    // Construct the full WebSocket URL
    const socketUrl = `${protocol}//${wsUrl}`;

    console.log(`Connecting to Socket.IO at ${socketUrl} with options:`, {
      ...socketOptions,
      auth: { ...socketOptions.auth, token: '[REDACTED]' },
      query: { ...socketOptions.query, _: '[REDACTED]' }
    });

    // Create a new socket instance with the full URL
    const socketInstance = io(socketUrl, socketOptions);
    
    // Store the socket instance in the ref
    socketRef.current = socketInstance;
    connectionAttempts.current++;
    
    // Set a unique connection ID for debugging
    const connectionId = `conn_${Date.now()}`;
    console.log(`[${connectionId}] Initializing socket connection... (Attempt ${connectionAttempts.current})`);

    // Debug logging
    console.log('Initializing socket connection to:', socketUrl);

    // Set up event listeners
    const onConnect = () => {
      console.log(`[${connectionId}] ✅ Connected to socket server`);
      console.log(`[${connectionId}] Socket ID:`, socketInstance.id);
      setIsConnected(true);
      
      // Set user as active
      socketInstance.emit('setActive', { userId });
      
      // Join the user's room with retry logic
      const joinRoom = () => {
        if (socketInstance.connected) {
          console.log('Joining user room:', userId);
          socketInstance.emit('join', { userId }, (response: any) => {
            if (response?.status === 'ok') {
              console.log('Successfully joined room');
            } else {
              console.warn('Failed to join room, retrying...');
              setTimeout(joinRoom, 1000);
            }
          });
        }
      };
      
      joinRoom();
    };

    const onDisconnect = (reason: string) => {
      console.log(`[${connectionId}] Disconnected from socket server. Reason:`, reason);
      setIsConnected(false);
      
      // Only attempt to reconnect if not explicitly disconnected and under max attempts
      if (reason !== 'io client disconnect' && connectionAttempts.current < maxConnectionAttempts) {
        console.log(`[${connectionId}] Attempting to reconnect... (${connectionAttempts.current}/${maxConnectionAttempts})`);
        // Use a longer delay before attempting to reconnect
        setTimeout(() => {
          if (!socketInstance.connected && connectionAttempts.current < maxConnectionAttempts) {
            console.log(`[${connectionId}] Manually reconnecting...`);
            socketInstance.connect();
          }
        }, 3000);
      }
    };

    const onError = (error: Error) => {
      console.error(`[${connectionId}] Socket error:`, error);
      setIsConnected(false);
      
      // Log additional connection state
      console.log(`[${connectionId}] Connection state:`, {
        connected: socketInstance.connected,
        disconnected: socketInstance.disconnected,
        id: socketInstance.id
      });
    };

    // Register event listeners
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);
    socketInstance.on('reconnect', (attempt: number) => {
      console.log(`Reconnected after ${attempt} attempts`);
      setIsConnected(true);
    });
    
    // Set the socket in state
    setSocket(socketInstance);

    // Cleanup function
    return () => {
      console.log(`[${connectionId}] Cleaning up socket connection`);
      // Remove all listeners to prevent memory leaks
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onError);
      socketInstance.off('reconnect');
      socketInstance.off('reconnect_attempt');
      socketInstance.off('reconnect_error');
      socketInstance.off('reconnect_failed');
      
      // Only disconnect if we're still connected
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
      
      console.log(`[${connectionId}] Socket connection cleanup complete`);
    };
  }, [isLoaded, userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
