import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = 'https://cjsaacyzobxyuwxcmlxt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc2FhY3l6b2J4eXV3eGNtbHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2NzcxNzcsImV4cCI6MjA0NzI1MzE3N30.252pSpg20tYwy7o9yT1QVVL0Z3SVuIBdVe2FlWmT3Ns';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);