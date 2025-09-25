import { useEffect, useRef } from 'react';
import { DocumentsService } from '@/shared/api/documentsService';
import { apiClient } from '@/shared/api';

/**
 * Hook for automatic cleanup of document editing sessions
 * Automatically unlocks documents when user closes browser or navigates away
 */
export const useDocumentCleanup = () => {
  const openDocumentsRef = useRef<Set<string>>(new Set());
  const documentsServiceRef = useRef<DocumentsService>(new DocumentsService(apiClient));

  // Track opened documents
  const addOpenDocument = (documentId: string) => {
    openDocumentsRef.current.add(documentId);
  };

  const removeOpenDocument = (documentId: string) => {
    openDocumentsRef.current.delete(documentId);
  };

  const getOpenDocuments = () => {
    return Array.from(openDocumentsRef.current);
  };

  // Cleanup function
  const cleanupDocuments = async () => {
    const openDocuments = getOpenDocuments();
    if (openDocuments.length > 0) {
      try {
        console.log('Cleaning up editing sessions for documents:', openDocuments);
        await documentsServiceRef.current.cleanupEditingSessions(openDocuments);
        openDocumentsRef.current.clear();
      } catch (error) {
        console.error('Error during document cleanup:', error);
      }
    }
  };

  useEffect(() => {
    // Cleanup on page unload (browser close/refresh)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const openDocuments = getOpenDocuments();
      if (openDocuments.length > 0) {
        // Trigger cleanup (best effort)
        cleanupDocuments();
        
        // Show warning if user has unsaved changes
        const message = 'You have documents open for editing. Your changes may be lost if you leave now.';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    // Cleanup on page visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When tab becomes hidden, consider cleanup after a delay
        setTimeout(() => {
          if (document.hidden) {
            console.log('Tab hidden for extended period, cleaning up documents');
            cleanupDocuments();
          }
        }, 5 * 60 * 1000); // 5 minutes delay
      }
    };

    // Cleanup on focus loss (window loses focus)
    const handleWindowBlur = () => {
      // Store the time when window lost focus
      const blurTime = Date.now();
      
      const checkAndCleanup = () => {
        // If window has been unfocused for more than 10 minutes, cleanup
        if (Date.now() - blurTime > 10 * 60 * 1000 && !document.hasFocus()) {
          console.log('Window unfocused for extended period, cleaning up documents');
          cleanupDocuments();
        }
      };
      
      setTimeout(checkAndCleanup, 10 * 60 * 1000); // 10 minutes
    };

    // Cleanup on network disconnection
    const handleOffline = () => {
      console.log('Network disconnected, preparing for cleanup');
      // Don't immediately cleanup, but prepare for it
      setTimeout(() => {
        if (!navigator.onLine) {
          console.log('Still offline, cleaning up documents');
          cleanupDocuments();
        }
      }, 2 * 60 * 1000); // 2 minutes delay
    };

    // Register event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('offline', handleOffline);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('offline', handleOffline);
      
      // Final cleanup
      cleanupDocuments();
    };
  }, []);

  // Periodic cleanup (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const openDocuments = getOpenDocuments();
      if (openDocuments.length > 0) {
        console.log('Periodic cleanup check for documents:', openDocuments);
        // Could implement logic to check which documents are still actively being edited
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    addOpenDocument,
    removeOpenDocument,
    getOpenDocuments,
    cleanupDocuments
  };
};
