import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FunctionCall } from '@/stores/chatStore';
import { 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  ChevronDown, 
  ChevronRight,
  Code
} from 'lucide-react';

interface FunctionCallDisplayProps {
  functionCall: FunctionCall;
  className?: string;
}

export function FunctionCallDisplay({ functionCall, className }: FunctionCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (functionCall.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'executing':
        return <Play className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (functionCall.status) {
      case 'pending':
        return 'border-gray-300 bg-gray-50';
      case 'executing':
        return 'border-blue-300 bg-blue-50';
      case 'completed':
        return 'border-green-300 bg-green-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getStatusText = () => {
    switch (functionCall.status) {
      case 'pending':
        return 'Pending';
      case 'executing':
        return 'Executing';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={cn(
      'border rounded-lg transition-all duration-200',
      getStatusColor(),
      className
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <Code className="w-4 h-4 text-gray-600" />
          <span className="font-mono text-sm font-medium text-gray-800">
            {functionCall.name}
          </span>
          <span className={cn(
            'px-2 py-1 text-xs rounded-full font-medium',
            functionCall.status === 'pending' && 'bg-gray-200 text-gray-700',
            functionCall.status === 'executing' && 'bg-blue-200 text-blue-700',
            functionCall.status === 'completed' && 'bg-green-200 text-green-700',
            functionCall.status === 'error' && 'bg-red-200 text-red-700'
          )}>
            {getStatusText()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatTimestamp(functionCall.timestamp)}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-3">
          {/* Description */}
          {functionCall.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{functionCall.description}</p>
            </div>
          )}

          {/* Arguments */}
          {Object.keys(functionCall.arguments).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Arguments</h4>
              <div className="bg-white rounded border p-2">
                <pre className="text-xs text-gray-800 overflow-x-auto">
                  {JSON.stringify(functionCall.arguments, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Result */}
          {functionCall.result !== undefined && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {functionCall.status === 'error' ? 'Error' : 'Result'}
              </h4>
              <div className={cn(
                'rounded border p-2',
                functionCall.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white'
              )}>
                <pre className={cn(
                  'text-xs overflow-x-auto',
                  functionCall.status === 'error' ? 'text-red-800' : 'text-gray-800'
                )}>
                  {typeof functionCall.result === 'string' 
                    ? functionCall.result 
                    : JSON.stringify(functionCall.result, null, 2)
                  }
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Function ID: {functionCall.id}</span>
            {functionCall.status === 'executing' && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}