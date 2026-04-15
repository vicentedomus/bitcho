// Configuración pública del frontend.
// La anon key de Supabase está diseñada para ser pública (respeta RLS).
// La service_role_key NUNCA va aquí — solo en credenciales de n8n.

const CONFIG = {
  SUPABASE_URL:      'https://dwmzchtqjcblupmmklcl.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3bXpjaHRxamNibHVwbW1rbGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTI2NjMsImV4cCI6MjA4OTU4ODY2M30.MCYuO-O60I5heT0MzXeF8euTMFKEENFkm_QsAfinGDc',
  SUPABASE_SCHEMA:   'bitcho',
  BITSO_API:         'https://api.bitso.com/v3',
  INITIAL_BALANCE_MXN: 10000,
};
