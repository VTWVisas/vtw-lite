export interface Database {
  public: {
    Tables: {
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          category: string | null
          target_date: string | null
          progress_percentage: number
          status: 'active' | 'completed' | 'paused' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          category?: string | null
          target_date?: string | null
          progress_percentage?: number
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          category?: string | null
          target_date?: string | null
          progress_percentage?: number
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
      }
      task_columns: {
        Row: {
          id: string
          user_id: string
          name: string
          position: number
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          position: number
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          position?: number
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          column_id: string | null
          title: string
          description: string | null
          due_date: string | null
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
          position: number
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          column_id?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'todo' | 'in_progress' | 'completed' | 'cancelled'
          position?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          column_id?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'todo' | 'in_progress' | 'completed' | 'cancelled'
          position?: number
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          frequency: 'daily' | 'weekly' | 'monthly'
          target_count: number
          current_streak: number
          longest_streak: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'monthly'
          target_count?: number
          current_streak?: number
          longest_streak?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'monthly'
          target_count?: number
          current_streak?: number
          longest_streak?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      habit_entries: {
        Row: {
          id: string
          user_id: string
          habit_id: string
          completed_at: string
          count: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          habit_id: string
          completed_at: string
          count?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string
          completed_at?: string
          count?: number
          notes?: string | null
          created_at?: string
        }
      }
      finance_records: {
        Row: {
          id: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string | null
          tags: string[] | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description?: string | null
          tags?: string[] | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          description?: string | null
          tags?: string[] | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          mood_rating: number | null
          tags: string[] | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          mood_rating?: number | null
          tags?: string[] | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          mood_rating?: number | null
          tags?: string[] | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          tags: string[] | null
          linked_notes: string[] | null
          is_public: boolean
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content: string
          tags?: string[] | null
          linked_notes?: string[] | null
          is_public?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string
          tags?: string[] | null
          linked_notes?: string[] | null
          is_public?: boolean
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
          updated_at?: string
        }
      }
      time_blocks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          task_id: string | null
          color: string
          is_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          task_id?: string | null
          color?: string
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          task_id?: string | null
          color?: string
          is_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      time_block_tags: {
        Row: {
          id: string
          time_block_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          time_block_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          time_block_id?: string
          tag_id?: string
          created_at?: string
        }
      }
      pomodoro_sessions: {
        Row: {
          id: string
          user_id: string
          title: string | null
          duration_minutes: number
          break_duration_minutes: number | null
          started_at: string
          completed_at: string | null
          is_completed: boolean
          time_block_id: string | null
          task_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          duration_minutes?: number
          break_duration_minutes?: number | null
          started_at: string
          completed_at?: string | null
          is_completed?: boolean
          time_block_id?: string | null
          task_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          duration_minutes?: number
          break_duration_minutes?: number | null
          started_at?: string
          completed_at?: string | null
          is_completed?: boolean
          time_block_id?: string | null
          task_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      pomodoro_session_tags: {
        Row: {
          id: string
          pomodoro_session_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          pomodoro_session_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          pomodoro_session_id?: string
          tag_id?: string
          created_at?: string
        }
      }
    }
  }
}
