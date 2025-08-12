"use client";

import React from 'react';
import { RealtimeTable } from '@/components/realtime/RealtimeTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebSocketContext } from '@/lib/realtime/WebSocketProvider';

// Mock initial records for demonstration
const MOCK_RECORDS = [
  {
    id: 'recInitial1',
    fields: {
      Name: 'Sample Record 1',
      Status: 'Active',
      Description: 'This is a sample record for testing'
    },
    createdTime: '2025-01-10T10:00:00.000Z'
  },
  {
    id: 'recInitial2',
    fields: {
      Name: 'Sample Record 2',
      Status: 'Inactive',
      Description: 'Another sample record'
    },
    createdTime: '2025-01-10T11:00:00.000Z'
  }
];

export default function RealtimeDemoPage() {
  const { isConnected, stats, connectionStatus } = useWebSocketContext();

  const handleRecordUpdate = (recordId: string, fields: Record<string, any>) => {
    console.log('Record updated:', recordId, fields);
  };

  const handleRecordCreate = (record: any) => {
    console.log('Record created:', record);
  };

  const handleRecordDelete = (recordId: string) => {
    console.log('Record deleted:', recordId);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Real-time WebSocket Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience live collaboration with WebSocket-powered real-time updates. 
          Open this page in multiple browser tabs to see real-time synchronization in action.
        </p>
      </div>

      {/* Connection Status Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            WebSocket Connection Status
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className={isConnected ? "bg-green-100 text-green-800" : ""}
            >
              {connectionStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.messagesReceived}
              </div>
              <div className="text-sm text-gray-600">Messages Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.messagesSent}
              </div>
              <div className="text-sm text-gray-600">Messages Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.reconnectAttempts}
              </div>
              <div className="text-sm text-gray-600">Reconnect Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.lastConnected ? 'Connected' : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Connection Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">How to Test Real-time Features</CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-700">
          <ol className="list-decimal list-inside space-y-2">
            <li>Open this page in multiple browser tabs or windows</li>
            <li>Click the "Create Record" button in one tab</li>
            <li>Watch as the new record appears instantly in all other tabs</li>
            <li>Try updating or deleting records to see real-time synchronization</li>
            <li>Observe user presence indicators showing who's currently viewing the table</li>
          </ol>
        </CardContent>
      </Card>

      {/* Realtime Table Demo */}
      <RealtimeTable
        tableId="demo-table-001"
        tableName="Demo Table - Real-time Collaboration"
        initialRecords={MOCK_RECORDS}
        onRecordUpdate={handleRecordUpdate}
        onRecordCreate={handleRecordCreate}
        onRecordDelete={handleRecordDelete}
      />

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Backend Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  WebSocket server with gorilla/websocket
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  JWT-based authentication
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  User presence tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Table-specific event broadcasting
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Connection management & cleanup
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Frontend Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Automatic reconnection logic
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Real-time event handling
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Connection status indicators
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  User presence visualization
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Toast notifications for updates
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}