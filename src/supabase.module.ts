// supabase.module.ts
import { Module } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config'; // important for development

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

@Module({
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useValue: supabase,
    },
  ],
  exports: ['SUPABASE_CLIENT'],
})
export class SupabaseModule {}
