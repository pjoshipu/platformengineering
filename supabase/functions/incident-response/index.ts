import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface IncidentRequest {
  description: string;
  affected_services: string[];
  detected_time?: string;
  error_rate?: number;
  recent_deployments?: any[];
  demo_access_password?: string;
}

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

async function buildIncidentPrompt(payload: IncidentRequest): Promise<string> {
  return `You are an on-call incident response specialist. Classify and respond to this incident immediately.

Incident Report:
- Description: ${payload.description}
- Affected Services: ${payload.affected_services.join(", ")}
${payload.detected_time ? `- Detected at: ${payload.detected_time}` : ""}
${payload.error_rate ? `- Error Rate: ${payload.error_rate}%` : ""}

Recent Deployments:
${payload.recent_deployments ? JSON.stringify(payload.recent_deployments, null, 2) : "None provided"}

Provide an immediate incident response with:

1. Classification (P1-P4):
   - P1: Services completely down OR data loss OR security breach
   - P2: Degraded performance OR partial outage with customer impact
   - P3: Intermittent issues OR customer workaround exists
   - P4: Non-critical bugs OR internal tools only

2. Likely root cause with confidence score (0-100)
   - Check if deployment was within 15 min of incident start
   - Consider infrastructure, config, external dependency issues

3. Immediate actions (first 15 minutes)

4. ServiceNow ticket template (pre-fill format)

5. Escalation path and communication template

Format as JSON:
{
  "classification": {
    "severity": "P1" | "P2" | "P3" | "P4",
    "confidence_score": number
  },
  "likely_root_cause": {
    "cause": string,
    "confidence": number,
    "linked_deployment": string | null
  },
  "immediate_actions": string[],
  "servicenow_ticket": {
    "title": string,
    "description": string,
    "priority": number,
    "affected_services": string[]
  },
  "escalation_path": string[],
  "communication_template": string
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

async function parseIncidentResponse(response: any): Promise<any> {
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
    const payload: IncidentRequest = await req.json();

    // Validate required fields
    if (!payload.description || !payload.affected_services) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: description, affected_services" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Build prompt
    const prompt = await buildIncidentPrompt(payload);

    // Call OpenAI
    const openaiResponse = await callOpenAI(prompt);

    // Parse response
    const result = await parseIncidentResponse(openaiResponse);

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
