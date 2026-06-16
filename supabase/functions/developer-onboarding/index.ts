import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface OnboardingRequest {
  name: string;
  team: string;
  experience_level: "junior" | "intermediate" | "senior";
  prev_background?: string;
  start_date?: string;
  learning_preference?: "async" | "pair_programming" | "mixed";
  demo_access_password?: string;
}

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

async function buildOnboardingPrompt(payload: OnboardingRequest): Promise<string> {
  return `You are an experienced developer onboarding specialist. Create a personalized onboarding plan for a new hire.

New Hire Profile:
- Name: ${payload.name}
- Team: ${payload.team}
- Experience Level: ${payload.experience_level}
- Previous Background: ${payload.prev_background || "Not provided"}
- Start Date: ${payload.start_date || "TBD"}
- Learning Preference: ${payload.learning_preference || "mixed"}

Create a comprehensive personalized onboarding plan including:

1. Personalized Checklist (by task, category, estimated days to complete):
   - Adjust timeline based on experience level (junior=14 days, intermediate=7 days, senior=5 days)
   - Include repo setup, local development, key systems
   - Vary tasks by team context (frontend vs backend vs platform)

2. Personalized Resources:
   - Documentation links
   - Video tutorials if available
   - Pairing opportunities
   - Ranked by relevance (1-10 score)

3. First Week Agenda:
   - Day-by-day breakdown
   - Key people to meet
   - Goals to achieve

4. Success Metrics:
   - Measurable outcomes
   - Milestones

5. Mentor Assignment Recommendation (if available)

6. Ramp Time Estimate (in days)

Format as JSON:
{
  "onboarding_checklist": [
    {
      "task": string,
      "category": "setup" | "learning" | "systems" | "culture" | "projects",
      "estimated_days": number,
      "completed": false,
      "team_specific": boolean
    }
  ],
  "personalized_resources": [
    {
      "title": string,
      "url": string,
      "type": "docs" | "video" | "guide" | "tool",
      "relevance_score": number
    }
  ],
  "first_week_agenda": string,
  "success_metrics": string[],
  "mentor_assignment": string,
  "estimated_ramp_time_days": number,
  "learning_path_summary": string
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

async function parseOnboardingResponse(response: any): Promise<any> {
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
    const payload: OnboardingRequest = await req.json();

    // Validate required fields
    if (!payload.name || !payload.team || !payload.experience_level) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, team, experience_level" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Build prompt
    const prompt = await buildOnboardingPrompt(payload);

    // Call OpenAI
    const openaiResponse = await callOpenAI(prompt);

    // Parse response
    const result = await parseOnboardingResponse(openaiResponse);

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
