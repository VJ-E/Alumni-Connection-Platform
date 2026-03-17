"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import { useSession } from "next-auth/react";

const io = require("socket.io-client");

interface SocketContextType {
  socket: any;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { data: session, status } = useSession();
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (socketRef.current?.connected) return;

    const userId = session.user.id;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      query: { userId },
      auth: { token: userId },
      withCredentials: true,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      setIsConnected(true);
      socketInstance.emit("join", { userId });
    });

    socketInstance.on("disconnect", (reason: string) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error: Error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("connect_error");
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [status, session?.user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
