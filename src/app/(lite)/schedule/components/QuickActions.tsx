'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format, addDays, subDays, isToday } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock } from 'lucide-react'

interface QuickActionsProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  onCreateBlock: () => void
}

export default function QuickActions({ 
  selectedDate, 
  onDateChange, 
  onCreateBlock 
}: QuickActionsProps) {
  const goToPreviousDay = () => {
    onDateChange(subDays(selectedDate, 1))
  }

  const goToNextDay = () => {
    onDateChange(addDays(selectedDate, 1))
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Quick Actions
      </h3>

      {/* Date Navigation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousDay}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <div className="text-sm font-medium text-slate-900">
              {format(selectedDate, 'MMM d')}
            </div>
            <div className="text-xs text-slate-500">
              {format(selectedDate, 'EEEE')}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextDay}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {!isToday(selectedDate) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Clock className="w-3 h-3 mr-1" />
              Today
            </Button>
          </motion.div>
        )}
      </div>

      {/* Quick Create */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-slate-700">Quick Create</h4>
        
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={onCreateBlock}
            size="sm"
            className="justify-start h-8"
          >
            <Plus className="w-3 h-3 mr-2" />
            Time Block
          </Button>
          
          {/* Quick time templates */}
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: '30min', duration: 30 },
              { label: '1hr', duration: 60 },
              { label: '2hr', duration: 120 },
              { label: '4hr', duration: 240 },
            ].map((template) => (
              <Button
                key={template.duration}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  // This would create a quick block with the template duration
                  // For now, just open the create form
                  onCreateBlock()
                }}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Info */}
      <div className="text-xs text-slate-500 space-y-1">
        <div className="flex justify-between">
          <span>Week</span>
          <span>{format(selectedDate, 'w')}</span>
        </div>
        <div className="flex justify-between">
          <span>Day of year</span>
          <span>{format(selectedDate, 'D')}</span>
        </div>
      </div>
    </div>
  )
}
