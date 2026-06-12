import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xubdrewukeaabtrxxzot.supabase.co";
const supabaseKey = "sb_publishable_veFPRbLr6vt5oqVRZ00b9A_DdTKfQnN";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);