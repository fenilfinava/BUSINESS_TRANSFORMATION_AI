import { supabase } from "@/lib/supabase";
export { sanitizeError } from "@/utils/errorHandler";

export const createClient = () => supabase;

