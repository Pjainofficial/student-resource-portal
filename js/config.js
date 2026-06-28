/************************************************
 * SUPABASE CONFIG
 ************************************************/
const SUPABASE_URL = "https://jkdlpfuiwmfeigzynmzg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZGxwZnVpd21mZWlnenlubXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NzY4NDksImV4cCI6MjA5NDE1Mjg0OX0.5Yd7CaDPuurtFI8KIbxnswJ6Zf2KiV1w33wBTVUECl4";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/************************************************
 * APP CONFIG
 ************************************************/

const APP_CONFIG = {
  appName: "Digital Knowledge Library",
  bucketName: "pdfs",
};
