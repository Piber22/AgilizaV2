const SUPABASE_URL = "https://bcxtmhsliymapevhwsvc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjeHRtaHNsaXltYXBldmh3c3ZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1MTU3ODMsImV4cCI6MjExMTA5MTc4M30.z72vFgxE_5q3m_9enWFghaag0dg5_b9Nmoefo1klOB4";

// "sb" para não conflitar com o global window.supabase da CDN
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
