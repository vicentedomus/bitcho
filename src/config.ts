// Configuración pública del frontend.
// La anon key de Supabase está diseñada para ser pública (respeta RLS, solo lectura
// de las 5 vistas bitcho_*). La service_role_key NUNCA va aquí.

export const SUPABASE_URL = 'https://dwmzchtqjcblupmmklcl.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bXpjaHRxamNibHVwbW1rbGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTI2NjMsImV4cCI6MjA4OTU4ODY2M30.MCYuO-O60I5heT0MzXeF8euTMFKEENFkm_QsAfinGDc';

// Schema base (para suscripciones realtime). La lectura va a las vistas en `public`.
export const SUPABASE_SCHEMA = 'bitcho';

export const INITIAL_BALANCE_MXN = 10000;

// Límites de query para acotar carga (SC-004). Ventana ~30 días horarios.
export const SNAPSHOT_LIMIT = 720;
export const DECISION_LIMIT = 800;
