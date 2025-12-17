"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from './ui/button';
import { Download, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip if already initialized or running on server-side
    if (hasInitialized.current || typeof window === 'undefined') {
      return;
    }
    
    // Mark as initialized
    hasInitialized.current = true;
    console.log('PWA: Initializing...');

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
                        
    if (isStandalone) {
      console.log('PWA: App is already installed');
      setIsInstalled(true);
      return;
    }

    // Check if user has already dismissed the prompt
    const hasDismissed = sessionStorage.getItem('pwa-install-dismissed') || 
                        localStorage.getItem('pwa-install-dismissed');
    
    const hasShown = sessionStorage.getItem('pwa-install-shown');
    
    // Only proceed if we haven't shown or dismissed the prompt in this session
    if (hasDismissed) {
      console.log('PWA: Prompt has been dismissed');
      return;
    }
    
    if (hasShown) {
      console.log('PWA: Prompt already shown in this session');
      return;
    }

    // Add a global function to reset PWA install prompt (for debugging/testing)
    (window as any).resetPWAInstallPrompt = () => {
      sessionStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismissed');
      sessionStorage.removeItem('pwa-install-shown');
      sessionStorage.removeItem('pwa-deferred-prompt');
      hasInitialized.current = false;
      window.location.reload();
    };

    // Check for existing deferred prompt
    const storedPrompt = sessionStorage.getItem('pwa-deferred-prompt');
    if (storedPrompt) {
      console.log('PWA: Found existing deferred prompt');
      // Only show the prompt if we haven't shown it in this session
      if (!sessionStorage.getItem('pwa-install-shown')) {
        setShowInstallPrompt(true);
        sessionStorage.setItem('pwa-install-shown', 'true');
      }
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      
      // Store the deferred prompt in session storage
      sessionStorage.setItem('pwa-deferred-prompt', 'true');
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Double-check that user hasn't dismissed it and we haven't shown it yet
      const currentDismissed = sessionStorage.getItem('pwa-install-dismissed') || 
                              localStorage.getItem('pwa-install-dismissed');
      const alreadyShown = sessionStorage.getItem('pwa-install-shown');
      
      if (!currentDismissed && !alreadyShown) {
        console.log('PWA: Showing install prompt');
        setShowInstallPrompt(true);
        // Mark as shown for this session
        sessionStorage.setItem('pwa-install-shown', 'true');
      } else {
        console.log('PWA: Not showing prompt - already shown or dismissed');
      }
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      // Clear stored prompt data
      sessionStorage.removeItem('pwa-deferred-prompt');
      sessionStorage.removeItem('pwa-install-shown');
      toast.success('Alumni Connect has been installed successfully!');
    };

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Register service worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setSwRegistration(registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  toast.info('New version available! Refresh to update.');
                }
              });
            }
          });

          // Handle service worker updates
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          });

          console.log('Service Worker registered successfully:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // Only add event listeners if they haven't been added before
    if (!(window as any).pwaEventListenersAdded) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Mark that we've added the event listeners
      (window as any).pwaEventListenersAdded = true;
    }

    // Register service worker
    registerServiceWorker();

    // Cleanup function
    return () => {
      // Don't remove event listeners on component unmount since they're global
      // and we want them to persist across page navigations
    };
  }, []); // Empty dependency array to run only once

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
        setShowInstallPrompt(false);
        // Clear stored prompt data
        sessionStorage.removeItem('pwa-deferred-prompt');
        sessionStorage.removeItem('pwa-install-shown');
        toast.success('Installation started!');
      } else {
        console.log('User dismissed the install prompt');
        toast.info('Installation cancelled');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
      toast.error('Installation failed. Please try again.');
    }
  };

  const handleDismiss = (permanent: boolean = false) => {
    console.log('PWA: Dismissing prompt, permanent:', permanent);
    setShowInstallPrompt(false);
    
    if (permanent) {
      // User chose "Not now" - remember this permanently
      localStorage.setItem('pwa-install-dismissed', 'true');
      sessionStorage.removeItem('pwa-deferred-prompt');
      sessionStorage.setItem('pwa-install-shown', 'true'); // Mark as shown to prevent showing again
      console.log('PWA: Prompt dismissed permanently');
    } else {
      // User closed the prompt - remember for this session only
      sessionStorage.setItem('pwa-install-dismissed', 'true');
      sessionStorage.setItem('pwa-install-shown', 'true'); // Mark as shown to prevent showing again
      console.log('PWA: Prompt dismissed for this session');
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
  };

  const handleUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Don't show if already installed or no prompt available
  if (isInstalled || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              Install Alumni Connect
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Get quick access to your alumni network with our app
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstallClick}
                className="text-xs"
              >
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDismiss(true)}
                className="text-xs"
              >
                Not now
              </Button>
            </div>
          </div>
          
          <button
            onClick={() => handleDismiss(false)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Export a hook for other components to use PWA functionality
export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isInstalled };
};
