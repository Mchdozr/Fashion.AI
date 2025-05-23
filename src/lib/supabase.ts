import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = 'https://falgqnojruzxvwklsnnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbGdxbm9qcnV6eHZ3a2xzbm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NTgyNjUsImV4cCI6MjA2MzQzNDI2NX0.9FvYiFXkyZPPRF9dwShtqi2-FYF_lJCD6a19dhbIS6Q';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);