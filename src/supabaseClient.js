import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wpynkjowoosxcegtvzvq.supabase.co";
const supabaseAnonKey = "sb_publishable_CV28W6y2OtnvilPA3fvhXw_is9OTArM";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
