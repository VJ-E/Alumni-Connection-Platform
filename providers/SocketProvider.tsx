"use client";

import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import SocketIOClient from 'socket.io-client';
const io = SocketIOClient;
type SocketType = ReturnType<typeof SocketIOClient>;
import { useContext } from "react";
import { SocketContext } from "@/contexts/SocketContext";

export const useSocket = () => {
  return useContext(SocketContext).socket;
};


export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded || !userId) return;

    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!,{
      transports: ['websocket'],
      autoConnect: true,
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      
      // Join the user's room
      socketInstance.emit('join', userId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('connect_error');
        socketInstance.disconnect();
      }
    };
  }, [isLoaded, userId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}
