import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface CostOptimizationRequest {
  compute_resources: any[];
  utilization_metrics: any;
  period_days?: number;
  demo_access_password?: string;
}

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

async function buildCostOptimizationPrompt(payload: CostOptimizationRequest): Promise<string> {
  return `You are a cloud cost optimization expert. Analyze the following resource utilization and provide actionable recommendations.

Compute Resources:
${JSON.stringify(payload.compute_resources, null, 2)}

Utilization Metrics (last ${payload.period_days || 30} days):
${JSON.stringify(payload.utilization_metrics, null, 2)}

Provide a comprehensive cost optimization analysis including:
1. Current monthly spend estimate
2. Wasted spend estimate (resources with <20% utilization)
3. Optimization potential (percentage savings possible)
4. Top 3-5 specific recommendations with:
   - Resource ID
   - Current configuration
   - Recommended change
   - Monthly savings
   - Risk level (low/medium/high)
   - Implementation effort (easy/medium/complex)
5. Rightsizing plan (phased approach)
6. Reserved instance strategy

Format your response as structured JSON with these exact fields:
{
  "cost_analysis": {
    "current_monthly_spend": number,
    "wasted_spend_estimate": number,
    "optimization_potential_percent": number
  },
  "recommendations": [
    {
      "resource_id": string,
      "current_config": string,
      "underutilization": string,
      "recommendation": string,
      "monthly_savings": number,
      "risk_level": "low" | "medium" | "high",
      "implementation_effort": "easy" | "medium" | "complex"
    }
  ],
  "rightsizing_plan": {
    "phase": number,
    "resource_changes": string[],
    "estimated_savings": number,
    "testing_period_days": number
  },
  "reserved_instance_strategy": string
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

async function parseCostOptimizationResponse(response: any): Promise<any> {
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
    const payload: CostOptimizationRequest = await req.json();

    // Validate required fields
    if (!payload.compute_resources || !payload.utilization_metrics) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: compute_resources, utilization_metrics" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Build prompt
    const prompt = await buildCostOptimizationPrompt(payload);

    // Call OpenAI
    const openaiResponse = await callOpenAI(prompt);

    // Parse response
    const result = await parseCostOptimizationResponse(openaiResponse);

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
