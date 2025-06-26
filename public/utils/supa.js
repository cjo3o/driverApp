const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://zgrjjnifqoactpuqolao.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncmpqbmlmcW9hY3RwdXFvbGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyNDc0NTgsImV4cCI6MjA1NjgyMzQ1OH0._Vl-6CRKdMjeDRyNoxlfect7sgusZ7L0N5OYu0a5hT0";
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY // 또는 ANON_KEY
);
module.exports = supabase;