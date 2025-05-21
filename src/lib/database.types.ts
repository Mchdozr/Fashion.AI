export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          credits: number
          subscription_tier: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          credits?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          credits?: number
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          model_image_url: string
          garment_image_url: string
          result_image_url: string | null
          category: 'top' | 'bottom' | 'full-body'
          performance_mode: 'performance' | 'balanced' | 'quality'
          num_samples: number
          seed: number
          created_at: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          task_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          model_image_url: string
          garment_image_url: string
          result_image_url?: string | null
          category: 'top' | 'bottom' | 'full-body'
          performance_mode: 'performance' | 'balanced' | 'quality'
          num_samples: number
          seed: number
          created_at?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          task_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          model_image_url?: string
          garment_image_url?: string
          result_image_url?: string | null
          category?: 'top' | 'bottom' | 'full-body'
          performance_mode?: 'performance' | 'balanced' | 'quality'
          num_samples?: number
          seed?: number
          created_at?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          task_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}