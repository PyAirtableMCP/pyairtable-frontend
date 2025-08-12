"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamic import for heavy chart component with recharts
const UsageChart = dynamic(
  () => import('./UsageChart').then(mod => ({ default: mod.UsageChart })),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Loading chart...</p>
        </div>
      </div>
    ),
    ssr: false
  }
);

export { UsageChart };