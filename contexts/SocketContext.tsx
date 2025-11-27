"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded || !userId) return;

    // Socket.IO connection options
    const socketOptions = {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      // Add secure flag for HTTPS
      secure: process.env.NODE_ENV === 'production',
      // Add query parameters for user identification
      query: {
        userId: userId,
        clientType: 'web',
        version: '1.0',
        t: Date.now() // Add timestamp to prevent caching
      },
      // Add authentication
      auth: {
        token: userId
      },
      // Add connection state recovery options
      withCredentials: true,
      // Add WebSocket specific options
      wsEngine: 'ws',
      // Add ping/pong timeouts
      pingTimeout: 10000,
      pingInterval: 25000
    };

    // Initialize socket connection with retry logic
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!, socketOptions);
    
    // Set a unique connection ID for debugging
    const connectionId = `conn_${Date.now()}`;
    console.log(`[${connectionId}] Initializing socket connection...`);

    // Debug logging
    console.log('Initializing socket connection to:', process.env.NEXT_PUBLIC_SOCKET_URL);

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
      
      // Attempt to reconnect if not explicitly disconnected
      if (reason !== 'io client disconnect') {
        console.log(`[${connectionId}] Attempting to reconnect...`);
        // Use a small delay before attempting to reconnect
        setTimeout(() => {
          if (!socketInstance.connected) {
            console.log(`[${connectionId}] Manually reconnecting...`);
            socketInstance.connect();
          }
        }, 1000);
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
