import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Data Diode Logic: Metadata Scrubbing
    // We explicitly do NOT read headers like 'x-forwarded-for' or 'cf-connecting-ip'
    // to identify the user. Any metadata passed in the request body is the only
    // source of truth, and we encourage users to only include report-specific info.

    const { reportData, location } = await req.json();

    // 2. Initialize Supabase Client with Service Role Key
    // This allows the function to bypass RLS to insert into a restricted table
    // while maintaining the anonymity of the original requester.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // 3. One-Way Flow: Submit to Database
    const { data, error } = await supabaseClient
      .from("reports")
      .insert([
        {
          data: reportData,
          location: location, // Expecting PostGIS format or GeoJSON
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        message:
          "Report successfully scrubbed and transmitted through Data Diode.",
        id: data[0].id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
