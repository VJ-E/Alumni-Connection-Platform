"use client";

import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsReconnecting(false);
      toast.success('Connection restored!');
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error('You are now offline');
    };

    // Check initial status
    setIsOffline(!navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsReconnecting(true);
    
    // Try to reconnect by refreshing the page
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-sm font-medium">
          You are currently offline. Some features may be limited.
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRetry}
          disabled={isReconnecting}
          className="ml-2 h-6 px-2 text-xs border-yellow-600 text-yellow-900 hover:bg-yellow-600 hover:text-white"
        >
          {isReconnecting ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            'Retry'
          )}
        </Button>
      </div>
    </div>
  );
}

// Hook for other components to check online status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
