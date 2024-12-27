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
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      category_relations: {
        Row: {
          parent_id: string
          child_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          parent_id: string
          child_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          parent_id?: string
          child_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}