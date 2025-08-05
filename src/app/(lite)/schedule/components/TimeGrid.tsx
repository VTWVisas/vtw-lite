'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addHours, startOfDay, isAfter, isBefore } from 'date-fns'
import { Database } from '@/lib/types/database.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Check, Clock, Trash2, Edit } from 'lucide-react'

type TimeBlock = Database['public']['Tables']['time_blocks']['Row'] & {
  tags?: Database['public']['Tables']['tags']['Row'][]
}

interface TimeGridProps {
  date: Date
  timeBlocks: TimeBlock[]
  onEditBlock: (block: TimeBlock) => void
  onDeleteBlock: (blockId: string) => void
  onCreateBlock: () => void
  loading: boolean
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7 AM to 9 PM

export default function TimeGrid({ 
  date, 
  timeBlocks, 
  onEditBlock, 
  onDeleteBlock, 
  onCreateBlock,
  loading 
}: TimeGridProps) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  const getBlocksForHour = (hour: number) => {
    const hourStart = addHours(startOfDay(date), hour)
    const hourEnd = addHours(hourStart, 1)

    return timeBlocks.filter(block => {
      const blockStart = new Date(block.start_time)
      const blockEnd = new Date(block.end_time)
      
      // Block overlaps with this hour
      return isBefore(blockStart, hourEnd) && isAfter(blockEnd, hourStart)
    })
  }

  const getBlockPosition = (block: TimeBlock, hour: number) => {
    const blockStart = new Date(block.start_time)
    const blockEnd = new Date(block.end_time)
    const hourStart = addHours(startOfDay(date), hour)
    const hourEnd = addHours(hourStart, 1)

    // Calculate position within the hour
    const startMinutes = Math.max(0, (blockStart.getTime() - hourStart.getTime()) / (1000 * 60))
    const endMinutes = Math.min(60, (blockEnd.getTime() - hourStart.getTime()) / (1000 * 60))
    
    const top = (startMinutes / 60) * 100
    const height = ((endMinutes - startMinutes) / 60) * 100

    return { top: `${top}%`, height: `${height}%` }
  }

  const handleCompleteBlock = async (block: TimeBlock) => {
    // This would be handled in the parent component
    // For now, we'll just trigger an edit
    onEditBlock(block)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-2">
          {HOURS.map((hour) => (
            <div key={hour} className="h-16 bg-slate-50 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <h2 className="text-lg font-semibold text-slate-900">
          Daily Schedule - {format(date, 'MMM d')}
        </h2>
      </div>

      {/* Time Grid */}
      <div className="p-4">
        <div className="space-y-0 border border-slate-200 rounded-lg overflow-hidden">
          {HOURS.map((hour) => {
            const blocksInHour = getBlocksForHour(hour)
            const isHovered = hoveredHour === hour

            return (
              <motion.div
                key={hour}
                className={`relative h-16 border-b border-slate-100 last:border-b-0 transition-colors ${
                  isHovered ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                }`}
                onMouseEnter={() => setHoveredHour(hour)}
                onMouseLeave={() => setHoveredHour(null)}
                onClick={() => blocksInHour.length === 0 && onCreateBlock()}
              >
                {/* Time Label */}
                <div className="absolute left-0 top-0 w-16 h-full flex items-center justify-center border-r border-slate-200 bg-slate-50">
                  <span className="text-sm font-medium text-slate-600">
                    {format(addHours(startOfDay(date), hour), 'h:mm a')}
                  </span>
                </div>

                {/* Content Area */}
                <div className="ml-16 h-full relative">
                  {blocksInHour.length === 0 ? (
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute inset-2 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center cursor-pointer"
                        >
                          <span className="text-sm text-blue-600 font-medium">
                            Click to add time block
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ) : (
                    <>
                      {blocksInHour.map((block) => {
                        const position = getBlockPosition(block, hour)
                        
                        return (
                          <motion.div
                            key={block.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                              position: 'absolute',
                              top: position.top,
                              height: position.height,
                              left: '8px',
                              right: '8px',
                            }}
                            className={`
                              rounded-lg p-3 shadow-sm border-l-4 cursor-pointer
                              ${block.is_completed 
                                ? 'bg-green-50 border-l-green-500' 
                                : 'bg-white border-l-blue-500 hover:shadow-md'
                              }
                              transition-all duration-200
                            `}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-medium text-sm ${
                                  block.is_completed ? 'text-green-800 line-through' : 'text-slate-900'
                                }`}>
                                  {block.title}
                                </h4>
                                
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {format(new Date(block.start_time), 'h:mm')} - {format(new Date(block.end_time), 'h:mm a')}
                                    </span>
                                  </div>
                                </div>

                                {block.tags && block.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {block.tags.slice(0, 2).map((tag) => (
                                      <Badge
                                        key={tag.id}
                                        variant="secondary"
                                        className="text-xs px-2 py-0"
                                        style={{ backgroundColor: tag.color + '20', color: tag.color }}
                                      >
                                        {tag.name}
                                      </Badge>
                                    ))}
                                    {block.tags.length > 2 && (
                                      <Badge variant="secondary" className="text-xs px-2 py-0">
                                        +{block.tags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 ml-2">
                                {!block.is_completed && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleCompleteBlock(block)
                                    }}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-slate-400 hover:bg-slate-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEditBlock(block)
                                  }}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-red-400 hover:bg-red-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteBlock(block.id)
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
