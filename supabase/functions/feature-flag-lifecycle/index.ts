import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface FeatureFlagRequest {
  flags_inventory: any[];
  age_threshold_days?: number;
  demo_access_password?: string;
}

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

async function buildFlagLifecyclePrompt(payload: FeatureFlagRequest): Promise<string> {
  return `You are a feature flag hygiene expert. Analyze the feature flags inventory and provide cleanup recommendations.

Feature Flags Inventory:
${JSON.stringify(payload.flags_inventory, null, 2)}

Age Threshold for Staleness: ${payload.age_threshold_days || 90} days

Provide a comprehensive feature flag lifecycle analysis with:

1. Stale Flags (not accessed within threshold):
   - Flag ID and age
   - Last accessed date
   - Recommendation (remove/archive/refresh)
   - Removal risk (low/medium/high)
   - Affected code paths

2. Hygiene Violations:
   - Duplicate flags (v1, v2 versions of same feature)
   - Cross-team ownership (coordination risk)
   - Experiment flags not cleaned up

3. Cleanup Plan:
   - Phased removal schedule
   - Owners to notify
   - Testing requirements before removal
   - Timeline

Format as JSON:
{
  "stale_flags": [
    {
      "flag_id": string,
      "age_days": number,
      "last_accessed": string,
      "recommendation": "remove" | "refresh_owner" | "archive",
      "removal_risk": "low" | "medium" | "high",
      "affected_code_paths": string[]
    }
  ],
  "hygiene_violations": [
    {
      "violation": string,
      "severity": "info" | "warn" | "critical"
    }
  ],
  "cleanup_plan": {
    "phase": number,
    "flags_to_remove": string[],
    "owners_to_notify": string[],
    "timeline_days": number
  },
  "total_stale_flags": number,
  "estimated_cleanup_time_hours": number
}`;
}

async function callOpenAI(prompt: string): Promise<any> {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function parseFlagResponse(response: any): Promise<any> {
  try {
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { error: "Could not parse response", raw_response: content };
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return { error: "Response parsing failed", raw: response };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request
    const payload: FeatureFlagRequest = await req.json();

    // Validate required fields
    if (!payload.flags_inventory) {
      return new Response(
        JSON.stringify({ error: "Missing required field: flags_inventory" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Build prompt
    const prompt = await buildFlagLifecyclePrompt(payload);

    // Call OpenAI
    const openaiResponse = await callOpenAI(prompt);

    // Parse response
    const result = await parseFlagResponse(openaiResponse);

    // Return response
    return new Response(
      JSON.stringify({
        ...result,
        model_used: "gpt-4o-mini",
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
