import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScheduleView from './components/ScheduleView'

export default async function SchedulePage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/signin')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Schedule</h1>
          <p className="text-slate-600">Plan your day with time-blocking</p>
        </header>
        
        <Suspense fallback={<ScheduleViewSkeleton />}>
          <ScheduleView />
        </Suspense>
      </div>
    </div>
  )
}

function ScheduleViewSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Time grid skeleton */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sidebar skeleton */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="h-6 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
