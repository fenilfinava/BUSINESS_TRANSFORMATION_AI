import { createClient } from '@supabase/supabase-js';

// Delete the process.env lines and paste your REAL URL and REAL ANON KEY directly inside the quotes:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lstxnnspwrfscglmaexu.supabase.co"; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdHhubnNwd3Jmc2NnbG1hZXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNDE3MDAsImV4cCI6MjEwMzkxNzcwMH0.mKCX5YWQBYRGQdy5NfvdZN0Y8_1RjDMAuv9IpbkvNgI"; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
