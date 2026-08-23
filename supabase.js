
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xnqzfclgzykemcutvfah.supabase.co";
const SUPABASE_KEY = "sb_publishable_qCkz-0FuXzRV9PNBpJTm6A_gX5Hej-_";

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);