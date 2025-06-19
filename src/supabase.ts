import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // important for development

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are missing in .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
