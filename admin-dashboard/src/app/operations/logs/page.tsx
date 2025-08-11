'use client'

import { MainLayout } from '@/components/layout/MainLayout'
import { LogViewer } from '@/components/operational/LogViewer'

export default function LogsPage() {
  return (
    <MainLayout title="Log Viewer">
      <LogViewer />
    </MainLayout>
  )
}