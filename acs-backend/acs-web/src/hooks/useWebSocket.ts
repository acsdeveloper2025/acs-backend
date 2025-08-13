import { useEffect, useState, useCallback, useRef } from 'react';
import { webSocketService } from '@/services/websocket';
import { authService } from '@/services/auth';
import type {
  WebSocketEventHandlers,
  ConnectionStatus,
  NotificationEvent,
  CaseStatusUpdate,
  CaseUpdate,
  SystemBroadcast,
} from '@/types/websocket';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onNotification?: (notification: NotificationEvent) => void;
  onCaseUpdate?: (update: CaseUpdate) => void;
  onCaseStatusUpdate?: (update: CaseStatusUpdate) => void;
  onBroadcast?: (broadcast: SystemBroadcast) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    onNotification,
    onCaseUpdate,
    onCaseStatusUpdate,
    onBroadcast,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    webSocketService.getConnectionStatus()
  );
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const handlersRef = useRef<WebSocketEventHandlers>({});

  // Update connection status
  const updateConnectionStatus = useCallback(() => {
    setConnectionStatus(webSocketService.getConnectionStatus());
  }, []);

  // Handle notifications
  const handleNotification = useCallback((notification: NotificationEvent) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
    onNotification?.(notification);
  }, [onNotification]);

  // Handle case updates
  const handleCaseUpdate = useCallback((update: CaseUpdate) => {
    onCaseUpdate?.(update);
  }, [onCaseUpdate]);

  // Handle case status updates
  const handleCaseStatusUpdate = useCallback((update: CaseStatusUpdate) => {
    onCaseStatusUpdate?.(update);
  }, [onCaseStatusUpdate]);

  // Handle system broadcasts
  const handleBroadcast = useCallback((broadcast: SystemBroadcast) => {
    // Convert broadcast to notification
    const notification: NotificationEvent = {
      id: `broadcast-${Date.now()}`,
      type: broadcast.priority === 'high' ? 'error' : 
            broadcast.priority === 'medium' ? 'warning' : 'info',
      title: broadcast.title,
      message: broadcast.message,
      timestamp: broadcast.timestamp,
    };
    handleNotification(notification);
    onBroadcast?.(broadcast);
  }, [handleNotification, onBroadcast]);

  // Initialize WebSocket connection
  const connect = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      console.warn('Cannot connect to WebSocket: User not authenticated');
      return;
    }

    try {
      await webSocketService.connect();
      updateConnectionStatus();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      updateConnectionStatus();
    }
  }, [updateConnectionStatus]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    updateConnectionStatus();
  }, [updateConnectionStatus]);

  // Subscribe to case updates
  const subscribeToCase = useCallback((caseId: string) => {
    webSocketService.subscribeToCase(caseId);
  }, []);

  // Unsubscribe from case updates
  const unsubscribeFromCase = useCallback((caseId: string) => {
    webSocketService.unsubscribeFromCase(caseId);
  }, []);

  // Send case status update
  const updateCaseStatus = useCallback((caseId: string, status: string) => {
    webSocketService.updateCaseStatus(caseId, status);
  }, []);

  // Send typing indicator
  const sendTypingIndicator = useCallback((caseId: string, isTyping: boolean) => {
    webSocketService.sendTypingIndicator(caseId, isTyping);
  }, []);

  // Update location
  const updateLocation = useCallback((caseId: string, latitude: number, longitude: number) => {
    webSocketService.updateLocation(caseId, latitude, longitude);
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread notification count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Setup event handlers
  useEffect(() => {
    handlersRef.current = {
      onConnected: () => updateConnectionStatus(),
      onDisconnected: () => updateConnectionStatus(),
      onError: () => updateConnectionStatus(),
      onNotification: handleNotification,
      onCaseUpdated: handleCaseUpdate,
      onCaseStatusUpdated: handleCaseStatusUpdate,
      onBroadcast: handleBroadcast,
    };

    webSocketService.setEventHandlers(handlersRef.current);
  }, [
    updateConnectionStatus,
    handleNotification,
    handleCaseUpdate,
    handleCaseStatusUpdate,
    handleBroadcast,
  ]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !isInitialized && authService.isAuthenticated()) {
      connect();
      setIsInitialized(true);
    }
  }, [autoConnect, connect, isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInitialized) {
        disconnect();
      }
    };
  }, [disconnect, isInitialized]);

  // Listen for authentication changes
  useEffect(() => {
    const handleAuthChange = () => {
      if (authService.isAuthenticated()) {
        if (!webSocketService.isConnected && !webSocketService.isConnecting) {
          connect();
        }
      } else {
        disconnect();
      }
    };

    // Listen for storage changes (logout in another tab)
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [connect, disconnect]);

  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus.status === 'connected',
    isConnecting: connectionStatus.status === 'connecting',
    error: connectionStatus.error,
    latency: connectionStatus.latency,

    // Connection methods
    connect,
    disconnect,

    // Subscription methods
    subscribeToCase,
    unsubscribeFromCase,

    // Event methods
    updateCaseStatus,
    sendTypingIndicator,
    updateLocation,

    // Notifications
    notifications,
    unreadCount,
    markNotificationAsRead,
    clearNotifications,

    // WebSocket service instance for advanced usage
    webSocketService,
  };
}
