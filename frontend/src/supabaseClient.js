import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://lbxqswxivigcjspfcizh.supabase.co/", // coloque sua URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxieHFzd3hpdmlnY2pzcGZjaXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzY5MDYsImV4cCI6MjA3OTUxMjkwNn0.E6NfAC9dFOkBWaBglJC6NCGts3b_mmsEmWO1o6tzepw"                  // coloque sua anon key
);

export default supabase;