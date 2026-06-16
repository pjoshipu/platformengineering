import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface SecurityRequest {
  cves?: any[];
  secrets_found_count?: number;
  iac_drift?: boolean;
  compliance_requirements?: string[];
  demo_access_password?: string;
}

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

async function buildSecurityPrompt(payload: SecurityRequest): Promise<string> {
  return `You are a security expert. Analyze the security posture and provide a prioritized remediation plan.

CVEs:
${payload.cves ? JSON.stringify(payload.cves, null, 2) : "None provided"}

Secrets Found: ${payload.secrets_found_count || 0}

IaC Drift Detected: ${payload.iac_drift || false}

Compliance Requirements: ${payload.compliance_requirements?.join(", ") || "Not specified"}

Provide a comprehensive security analysis with:

1. Vulnerability Summary:
   - Count of critical unpatched vulnerabilities
   - High risk items
   - Total exposure score

2. Prioritized Actions:
   - Vulnerability ID
   - Severity (critical/high/medium/low)
   - Fix approach
   - Timeline (days)
   - Affected systems
   - Automation possible (yes/no)

3. Secrets Remediation:
   - Count found
   - Types (API keys, passwords, tokens, etc.)
   - Step-by-step remediation
   - Rotation requirements

4. IaC Drift Assessment:
   - Critical deviations detected
   - Sync recommendation
   - Automation strategy

5. Compliance Status:
   - Gap analysis
   - Remediation priority

Format as JSON:
{
  "vulnerability_summary": {
    "critical_unpatched": number,
    "high_risk_items": number,
    "total_exposure_score": number
  },
  "prioritized_actions": [
    {
      "vulnerability_id": string,
      "severity": "critical" | "high" | "medium" | "low",
      "fix_approach": string,
      "timeline_days": number,
      "affected_systems": string[],
      "automation_possible": boolean
    }
  ],
  "secrets_found": {
    "count": number,
    "types": string[],
    "remediation_steps": string[]
  },
  "iac_drift": {
    "drift_detected": boolean,
    "critical_deviations": string[],
    "sync_recommendation": string
  },
  "compliance_status": string,
  "overall_risk_level": "critical" | "high" | "medium" | "low"
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

async function parseSecurityResponse(response: any): Promise<any> {
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
    const payload: SecurityRequest = await req.json();

    // Build prompt
    const prompt = await buildSecurityPrompt(payload);

    // Call OpenAI
    const openaiResponse = await callOpenAI(prompt);

    // Parse response
    const result = await parseSecurityResponse(openaiResponse);

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
