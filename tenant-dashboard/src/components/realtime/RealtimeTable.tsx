"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRealtimeEvents } from '@/lib/hooks/useWebSocket';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Avatar components will be created inline
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface Record {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
  lastModified?: string;
}

interface RealtimeTableProps {
  tableId: string;
  tableName?: string;
  initialRecords?: Record[];
  onRecordUpdate?: (recordId: string, fields: Record<string, any>) => void;
  onRecordCreate?: (record: Record) => void;
  onRecordDelete?: (recordId: string) => void;
}

export const RealtimeTable: React.FC<RealtimeTableProps> = ({
  tableId,
  tableName = 'Table',
  initialRecords = [],
  onRecordUpdate,
  onRecordCreate,
  onRecordDelete,
}) => {
  const [records, setRecords] = useState<Record[]>(initialRecords);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  const {
    isConnected,
    events,
    userPresence,
    stats,
    sendMessage,
    clearEvents
  } = useRealtimeEvents(tableId);

  // Handle real-time events
  useEffect(() => {
    const latestEvent = events[events.length - 1];
    if (!latestEvent) return;

    setLastActivity(new Date());

    switch (latestEvent.type) {
      case 'record:created':
        const newRecord = latestEvent.payload?.data;
        if (newRecord && newRecord.id) {
          setRecords(prev => {
            // Check if record already exists to avoid duplicates
            const exists = prev.some(r => r.id === newRecord.id);
            if (!exists) {
              onRecordCreate?.(newRecord);
              return [...prev, newRecord];
            }
            return prev;
          });
          toast.success(`New record created: ${newRecord.fields?.Name || newRecord.id}`);
        }
        break;

      case 'record:updated':
        const updatedRecord = latestEvent.payload?.data;
        if (updatedRecord && updatedRecord.id) {
          setRecords(prev => 
            prev.map(record => 
              record.id === updatedRecord.id 
                ? { ...record, ...updatedRecord, lastModified: new Date().toISOString() }
                : record
            )
          );
          onRecordUpdate?.(updatedRecord.id, updatedRecord.fields);
          toast.info(`Record updated: ${updatedRecord.fields?.Name || updatedRecord.id}`);
        }
        break;

      case 'record:deleted':
        const deletedRecordId = latestEvent.payload?.recordId;
        if (deletedRecordId) {
          setRecords(prev => prev.filter(record => record.id !== deletedRecordId));
          onRecordDelete?.(deletedRecordId);
          toast.warning(`Record deleted: ${deletedRecordId}`);
        }
        break;
    }
  }, [events, onRecordUpdate, onRecordCreate, onRecordDelete]);

  // Simulate record operations for demo purposes
  const simulateRecordCreation = () => {
    const mockRecord = {
      id: `rec${Date.now()}`,
      fields: {
        Name: `New Record ${Math.floor(Math.random() * 1000)}`,
        Status: 'Active',
        CreatedAt: new Date().toISOString()
      },
      createdTime: new Date().toISOString()
    };

    // Simulate the API call and broadcast
    sendMessage('record:created', {
      tableId,
      recordId: mockRecord.id,
      data: mockRecord
    });
  };

  const simulateRecordUpdate = (recordId: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;

    const updatedRecord = {
      ...record,
      fields: {
        ...record.fields,
        Status: record.fields.Status === 'Active' ? 'Inactive' : 'Active',
        LastModified: new Date().toISOString()
      }
    };

    sendMessage('record:updated', {
      tableId,
      recordId: recordId,
      data: updatedRecord
    });
  };

  const simulateRecordDeletion = (recordId: string) => {
    sendMessage('record:deleted', {
      tableId,
      recordId
    });
  };

  const connectionStatusBadge = useMemo(() => {
    if (isConnected) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
    } else {
      return <Badge variant="destructive">Disconnected</Badge>;
    }
  }, [isConnected]);

  return (
    <div className="space-y-6">
      {/* Header with connection status and user presence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              {tableName}
              {connectionStatusBadge}
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {userPresence.length} user{userPresence.length !== 1 ? 's' : ''} viewing
              </span>
              {userPresence.map((userId, index) => (
                <div 
                  key={userId} 
                  className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800"
                >
                  <AvatarInitials name={userId} />
                </div>
              ))}
            </div>
          </div>
          {lastActivity && (
            <p className="text-sm text-gray-500">
              Last activity: {lastActivity.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demo Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={simulateRecordCreation} size="sm">
              Create Record
            </Button>
            <Button 
              onClick={() => clearEvents()} 
              variant="outline" 
              size="sm"
            >
              Clear Events
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Messages Received:</strong> {stats.messagesReceived}
            </div>
            <div>
              <strong>Messages Sent:</strong> {stats.messagesSent}
            </div>
            <div>
              <strong>Reconnect Attempts:</strong> {stats.reconnectAttempts}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Records ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {records.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No records yet. Create one to test real-time updates!
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <div 
                      key={record.id} 
                      className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {record.fields?.Name || record.id}
                        </div>
                        <Badge 
                          variant={record.fields?.Status === 'Active' ? 'default' : 'secondary'}
                        >
                          {record.fields?.Status || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {record.id}
                      </div>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(record.createdTime).toLocaleString()}
                        {record.lastModified && (
                          <> • Modified: {new Date(record.lastModified).toLocaleString()}</>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => simulateRecordUpdate(record.id)}
                        >
                          Update
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => simulateRecordDeletion(record.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Real-time Events Log */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Events ({events.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No events yet. Interact with records to see real-time updates!
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice().reverse().map((event, index) => (
                    <div key={`${event.timestamp}-${index}`} className="border-l-4 border-blue-200 pl-3 py-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{event.type}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(event.timestamp * 1000).toLocaleTimeString()}
                        </span>
                      </div>
                      {event.payload && (
                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper component for avatar initials
const AvatarInitials: React.FC<{ name: string }> = ({ name }) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  return <span>{initials}</span>;
};