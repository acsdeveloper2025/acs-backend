import React, { useEffect, useState } from 'react';
import { Activity, MapPin, FileText, Camera, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/useWebSocket';
import type {
  CaseStatusUpdate,
  CaseUpdate,
  MobileLocationUpdate,
  MobileFormProgress,
  MobilePhotoUpdate,
  CaseTypingUpdate,
} from '@/types/websocket';
import { formatDistanceToNow } from 'date-fns';

interface RealTimeUpdate {
  id: string;
  type: 'status' | 'location' | 'form' | 'photo' | 'typing' | 'general';
  caseId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  data?: any;
}

interface RealTimeCaseUpdatesProps {
  caseId?: string;
  maxUpdates?: number;
}

export function RealTimeCaseUpdates({ caseId, maxUpdates = 20 }: RealTimeCaseUpdatesProps) {
  const [updates, setUpdates] = useState<RealTimeUpdate[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  const { subscribeToCase, unsubscribeFromCase } = useWebSocket({
    onCaseStatusUpdate: (update: CaseStatusUpdate) => {
      if (!caseId || update.caseId === caseId) {
        addUpdate({
          id: `status-${Date.now()}`,
          type: 'status',
          caseId: update.caseId,
          userId: '',
          username: update.updatedBy,
          message: `Case status changed to ${update.status}`,
          timestamp: update.timestamp,
          data: { status: update.status },
        });
      }
    },
    onCaseUpdate: (update: CaseUpdate) => {
      if (!caseId || update.caseId === caseId) {
        addUpdate({
          id: `update-${Date.now()}`,
          type: 'general',
          caseId: update.caseId,
          userId: '',
          username: 'System',
          message: 'Case information updated',
          timestamp: update.timestamp,
          data: update.data,
        });
      }
    },
  });

  // Subscribe to case updates when caseId is provided
  useEffect(() => {
    if (caseId) {
      subscribeToCase(caseId);
      return () => unsubscribeFromCase(caseId);
    }
  }, [caseId, subscribeToCase, unsubscribeFromCase]);

  // Listen for mobile-specific events
  useEffect(() => {
    const handleMobileLocationUpdate = (update: MobileLocationUpdate) => {
      if (!caseId || update.caseId === caseId) {
        addUpdate({
          id: `location-${Date.now()}`,
          type: 'location',
          caseId: update.caseId,
          userId: update.userId,
          username: update.username,
          message: `Location updated (${update.location.accuracy}m accuracy)`,
          timestamp: update.location.timestamp,
          data: update.location,
        });
      }
    };

    const handleMobileFormProgress = (update: MobileFormProgress) => {
      if (!caseId || update.caseId === caseId) {
        addUpdate({
          id: `form-${Date.now()}`,
          type: 'form',
          caseId: update.caseId,
          userId: update.userId,
          username: update.username,
          message: `${update.formType} form progress: ${update.progress}%`,
          timestamp: update.timestamp,
          data: { formType: update.formType, progress: update.progress },
        });
      }
    };

    const handleMobilePhotoUpdate = (update: MobilePhotoUpdate) => {
      if (!caseId || update.caseId === caseId) {
        addUpdate({
          id: `photo-${Date.now()}`,
          type: 'photo',
          caseId: update.caseId,
          userId: update.userId,
          username: update.username,
          message: `${update.photoCount} photo(s) captured${update.hasGeoLocation ? ' with location' : ''}`,
          timestamp: update.timestamp,
          data: { photoCount: update.photoCount, hasGeoLocation: update.hasGeoLocation },
        });
      }
    };

    const handleTypingUpdate = (update: CaseTypingUpdate) => {
      if (!caseId || update.caseId === caseId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (update.isTyping) {
            newSet.add(update.username);
          } else {
            newSet.delete(update.username);
          }
          return newSet;
        });
      }
    };

    // Register event listeners
    const { webSocketService } = useWebSocket();
    webSocketService.on('mobile:location:update', handleMobileLocationUpdate);
    webSocketService.on('mobile:form:progress', handleMobileFormProgress);
    webSocketService.on('mobile:photo:update', handleMobilePhotoUpdate);
    webSocketService.on('case:typing:update', handleTypingUpdate);

    return () => {
      webSocketService.off('mobile:location:update', handleMobileLocationUpdate);
      webSocketService.off('mobile:form:progress', handleMobileFormProgress);
      webSocketService.off('mobile:photo:update', handleMobilePhotoUpdate);
      webSocketService.off('case:typing:update', handleTypingUpdate);
    };
  }, [caseId]);

  const addUpdate = (update: RealTimeUpdate) => {
    setUpdates(prev => [update, ...prev.slice(0, maxUpdates - 1)]);
  };

  const getUpdateIcon = (type: RealTimeUpdate['type']) => {
    switch (type) {
      case 'status':
        return <Activity className="h-4 w-4 text-blue-600" />;
      case 'location':
        return <MapPin className="h-4 w-4 text-green-600" />;
      case 'form':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'photo':
        return <Camera className="h-4 w-4 text-orange-600" />;
      case 'typing':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUpdateBadge = (type: RealTimeUpdate['type']) => {
    const config = {
      status: { variant: 'default' as const, label: 'Status' },
      location: { variant: 'secondary' as const, label: 'Location' },
      form: { variant: 'outline' as const, label: 'Form' },
      photo: { variant: 'outline' as const, label: 'Photo' },
      typing: { variant: 'secondary' as const, label: 'Typing' },
      general: { variant: 'outline' as const, label: 'Update' },
    };
    
    const { variant, label } = config[type] || config.general;
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Real-time Updates</span>
        </CardTitle>
        <CardDescription>
          Live updates for {caseId ? `case ${caseId}` : 'all cases'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Typing Indicators */}
        {typingUsers.size > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-sm text-muted-foreground">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          </div>
        )}

        <ScrollArea className="h-96">
          {updates.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No real-time updates yet</p>
              <p className="text-xs text-muted-foreground">Updates will appear here as they happen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((update) => (
                <div key={update.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 mt-0.5">
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{update.username}</span>
                        {getUpdateBadge(update.type)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{update.message}</p>
                    {update.data && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {update.type === 'location' && (
                          <span>
                            Lat: {update.data.latitude.toFixed(6)}, 
                            Lng: {update.data.longitude.toFixed(6)}
                          </span>
                        )}
                        {update.type === 'form' && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${update.data.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
