'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfDay, addHours, isToday } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/types/database.types'
import TimeGrid from './TimeGrid'
import TimeBlockForm from './TimeBlockForm'
import TagManager from './TagManager'
import QuickActions from './QuickActions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Calendar, Clock } from 'lucide-react'

type TimeBlock = Database['public']['Tables']['time_blocks']['Row'] & {
  tags?: Database['public']['Tables']['tags']['Row'][]
}

type Tag = Database['public']['Tables']['tags']['Row']

export default function ScheduleView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Load time blocks for selected date
  const loadTimeBlocks = useCallback(async () => {
    try {
      const startOfSelectedDay = startOfDay(selectedDate)
      const endOfSelectedDay = addHours(startOfSelectedDay, 24)

      const { data: blocksData, error: blocksError } = await supabase
        .from('time_blocks')
        .select(`
          *,
          time_block_tags (
            tags (*)
          )
        `)
        .gte('start_time', startOfSelectedDay.toISOString())
        .lt('start_time', endOfSelectedDay.toISOString())
        .order('start_time')

      if (blocksError) throw blocksError

      // Transform the data to include tags
      const transformedBlocks: TimeBlock[] = blocksData?.map(block => ({
        ...block,
        tags: block.time_block_tags?.map((tbt: { tags: any }) => tbt.tags).filter(Boolean) || []
      })) || []

      setTimeBlocks(transformedBlocks)
    } catch (error) {
      console.error('Error loading time blocks:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, supabase])

  // Load tags on component mount
  const loadTags = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }, [supabase])

  useEffect(() => {
    loadTimeBlocks()
  }, [loadTimeBlocks])

  // Load tags on component mount
  useEffect(() => {
    loadTags()
  }, [loadTags])

  const handleCreateBlock = () => {
    setEditingBlock(null)
    setIsCreating(true)
  }

  const handleEditBlock = (block: TimeBlock) => {
    setEditingBlock(block)
    setIsCreating(true)
  }

  const handleDeleteBlock = async (blockId: string) => {
    try {
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error
      
      setTimeBlocks(prev => prev.filter(block => block.id !== blockId))
    } catch (error) {
      console.error('Error deleting time block:', error)
    }
  }

  const handleBlockSaved = () => {
    setIsCreating(false)
    setEditingBlock(null)
    loadTimeBlocks()
  }

  const handleTagsUpdated = () => {
    loadTags()
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          {isToday(selectedDate) && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
            >
              Today
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            disabled={isToday(selectedDate)}
          >
            <Clock className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button onClick={handleCreateBlock} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Block
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Time Grid - Main Content */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3"
        >
          <Card className="p-0 overflow-hidden">
            <TimeGrid
              date={selectedDate}
              timeBlocks={timeBlocks}
              onEditBlock={handleEditBlock}
              onDeleteBlock={handleDeleteBlock}
              onCreateBlock={handleCreateBlock}
              loading={loading}
            />
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Quick Actions */}
          <Card className="p-4">
            <QuickActions
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onCreateBlock={handleCreateBlock}
            />
          </Card>

          {/* Today's Summary */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Today's Focus</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Blocks</span>
                <span className="font-medium">{timeBlocks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Completed</span>
                <span className="font-medium text-green-600">
                  {timeBlocks.filter(block => block.is_completed).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Remaining</span>
                <span className="font-medium text-orange-600">
                  {timeBlocks.filter(block => !block.is_completed).length}
                </span>
              </div>
            </div>
          </Card>

          {/* Tag Manager */}
          <Card className="p-4">
            <TagManager
              tags={tags}
              onTagsUpdated={handleTagsUpdated}
            />
          </Card>
        </motion.div>
      </div>

      {/* Time Block Form Modal */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsCreating(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <TimeBlockForm
                block={editingBlock}
                selectedDate={selectedDate}
                tags={tags}
                onSave={handleBlockSaved}
                onCancel={() => setIsCreating(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
