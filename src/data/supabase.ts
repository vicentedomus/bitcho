import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';

// Cliente de solo lectura. La lectura va a las vistas en `public` (bitcho_*);
// las suscripciones realtime apuntan a las tablas base en el schema `bitcho`.
export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
