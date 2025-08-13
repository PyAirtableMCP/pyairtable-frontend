import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { ChatMessage as ChatMessageType, FunctionCall } from '@/stores/chatStore';
import { FunctionCallDisplay } from './FunctionCallDisplay';
import { User, Bot, AlertCircle } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-colors',
        isUser && 'bg-blue-50 border-l-4 border-blue-500',
        isSystem && 'bg-orange-50 border-l-4 border-orange-500',
        !isUser && !isSystem && 'bg-gray-50 border-l-4 border-gray-300',
        className
      )}
    >
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser && 'bg-blue-500 text-white',
        isSystem && 'bg-orange-500 text-white',
        !isUser && !isSystem && 'bg-gray-500 text-white'
      )}>
        {isUser ? (
          <User size={16} />
        ) : isSystem ? (
          <AlertCircle size={16} />
        ) : (
          <Bot size={16} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn(
            'text-sm font-medium',
            isUser && 'text-blue-700',
            isSystem && 'text-orange-700',
            !isUser && !isSystem && 'text-gray-700'
          )}>
            {isUser ? 'You' : isSystem ? 'System' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.isStreaming && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs text-blue-600">Streaming...</span>
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className={cn(
          'prose prose-sm max-w-none',
          isUser && 'prose-blue',
          isSystem && 'prose-orange',
          !isUser && !isSystem && 'prose-gray'
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-gray-900">{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                // Customize markdown rendering
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <pre className="bg-gray-100 rounded p-2 overflow-x-auto">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600">
                    {children}
                  </blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-4 py-2">
                    {children}
                  </td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Function Calls */}
        {message.functionCalls && message.functionCalls.length > 0 && (
          <div className="mt-4 space-y-2">
            {message.functionCalls.map((functionCall) => (
              <FunctionCallDisplay
                key={functionCall.id}
                functionCall={functionCall}
              />
            ))}
          </div>
        )}

        {/* Metadata */}
        {message.metadata && Object.keys(message.metadata).length > 0 && (
          <details className="mt-3">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              Message Details
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(message.metadata, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}