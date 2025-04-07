import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

function createSupabaseClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );
}

export const supabaseClient = createSupabaseClient();
