import React from 'react';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  isVisible?: boolean;
  className?: string;
}

export function TypingIndicator({ isVisible = false, className }: TypingIndicatorProps) {
  if (!isVisible) return null;

  return (
    <div className={cn(
      'flex gap-3 p-4 rounded-lg bg-gray-50 border-l-4 border-gray-300 animate-fade-in',
      className
    )}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
        <Bot size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Assistant</span>
          <span className="text-xs text-gray-500">typing...</span>
        </div>

        {/* Typing Animation */}
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-gray-500 ml-2">thinking...</span>
        </div>
      </div>
    </div>
  );
}