import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const MODEL = "google/gemini-3-flash-preview";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Extract structured JD fields from raw text
 * RULES: Only extract explicitly stated info, no hallucination, normalize values
 */
function extractJDFields(jd: string): Record<string, string> {
  // Helper to safely extract with regex
  const extractField = (patterns: RegExp[], defaultVal = "Not specified"): string => {
    for (const pattern of patterns) {
      const match = jd.match(pattern);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }
    return defaultVal;
  };

  return {
    job_title: extractField([
      /(?:📌\s*Role|Role:|Job Title:|Position:)\s*([^\n]+)/i,
      /^[A-Z][A-Za-z\s/()]+(?:Engineer|Developer|Manager|Lead|Specialist)/m,
    ]),

    experience_required: extractField([
      /(?:📌\s*Experience|Experience:)\s*([^\n]+)/i,
      /(?:years?(?:\s+of)?\s+experience|fresher|entry-?level|junior|senior).*?(\d+[+-]?\s*years?|fresher|entry-?level|junior)/i,
    ]),

    location: extractField([
      /(?:📌\s*Location|Location:)\s*([^\n]+)/i,
      /(?:location|city|based|work\s+from):\s*([^\n]+)/i,
    ]),

    education: extractField([
      /(?:🎓\s*Education|Education:)\s*([^\n]+)/i,
      /(?:education|degree|qualification):\s*([^\n]+)/i,
    ]),

    salary_range: extractField([
      /(?:📊\s*Salary|Salary:)\s*([^\n]+)/i,
      /(?:salary|ctc|compensation|package):\s*([^\n]+)/i,
    ]),
  };
}

async function callAI(messages: any[], tool?: any, attempt = 0): Promise<any> {
  const body: any = { model: MODEL, messages };
  if (tool) {
    body.tools = [tool];
    body.tool_choice = { type: "function", function: { name: tool.function.name } };
  }
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429 && attempt < 4) {
    const wait = 2000 * Math.pow(2, attempt); // 2s,4s,8s,16s
    await sleep(wait);
    return callAI(messages, tool, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(`AI gateway error ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (tool) {
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("No tool call returned");
    return JSON.parse(call.function.arguments);
  }
  return data.choices?.[0]?.message?.content ?? "";
}

const scoutTool = {
  type: "function",
  function: {
    name: "scout_candidates",
    description: "Parse a JD, evaluate all candidates, simulate outreach, and return a ranked shortlist.",
    parameters: {
      type: "object",
      properties: {
        jd_parsed: {
          type: "object",
          properties: {
            job_title: { type: "string", description: "Extract job role/title. Examples: AI/ML Engineer, Senior Developer, Frontend Engineer. Never empty - use JD heading or context." },
            required_skills: { type: "array", items: { type: "string" }, description: "Technical skills required. Extract from Required Skills section." },
            experience_required: { type: "string", description: "Years of experience required. Examples: '0-1 years', 'Fresher', '2-5 years', '5+ years'. Never empty." },
            location: { type: "string", description: "Work location. Examples: 'Mumbai / Remote / Hybrid', 'Bangalore (Hybrid)', 'Remote Only'. Never empty." },
            education: { type: "string", description: "Education requirements. Examples: 'B.E/B.Tech in CS', 'Any Bachelor degree', 'Not specified'. Never empty." },
            salary_range: { type: "string", description: "Salary or compensation range. Examples: '₹3-6 LPA', 'Competitive', 'Not specified'. Never empty." },
            responsibilities: { type: "array", items: { type: "string" }, description: "Key responsibilities from the JD." },
            keywords: { type: "array", items: { type: "string" }, description: "Important keywords extracted from entire JD." },
          },
          required: ["job_title", "required_skills", "experience_required", "location", "education", "salary_range", "responsibilities", "keywords"],
          additionalProperties: false,
        },
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              match_score: { type: "number" },
              match_breakdown: {
                type: "object",
                properties: {
                  skill: { type: "number" },
                  experience: { type: "number" },
                  domain: { type: "number" },
                },
                required: ["skill", "experience", "domain"],
                additionalProperties: false,
              },
              match_reasoning: { type: "string" },
              interest_score: { type: "number" },
              interest_level: { type: "string", enum: ["Yes", "Maybe", "No"] },
              notice_period: { type: "string" },
              expected_salary: { type: "string" },
              location_open: { type: "string", enum: ["Yes", "Maybe", "No"] },
              interest_reasoning: { type: "string" },
              final_score: { type: "number" },
              chat_transcript: { type: "string" },
              transcript: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    role: { type: "string", enum: ["recruiter", "candidate"] },
                    message: { type: "string" },
                  },
                  required: ["role", "message"],
                  additionalProperties: false,
                },
              },
            },
            required: ["name","match_score","match_breakdown","match_reasoning","interest_score","interest_level","notice_period","expected_salary","location_open","interest_reasoning","final_score","chat_transcript","transcript"],
            additionalProperties: false,
          },
        },
      },
      required: ["jd_parsed", "results"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { jd, candidates } = await req.json();
    if (typeof jd !== "string" || !jd.trim()) {
      return new Response(JSON.stringify({ error: "JD is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return new Response(JSON.stringify({ error: "candidates array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (candidates.length > 50) {
      return new Response(JSON.stringify({ error: "Limit 50 candidates per run" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scouting = await callAI(
      [
        {
          role: "system",
          content: `You are an AI-powered Talent Scouting & JD Parsing Agent.

🎯 YOUR PRIMARY TASK: Extract JD fields intelligently from ANY format

IMPORTANT: You are the PRIMARY extractor. Regex fallback is secondary.
Your job is to intelligently parse JD regardless of format:
- Labeled sections (Role:, Experience:, etc.)
- Paragraph text (unstructured)
- LinkedIn/Naukri copied format
- Messy or incomplete text
- Multiple formats mixed together

🔍 EXTRACTION INSTRUCTIONS (AI-FIRST):
1. Read the ENTIRE JD carefully
2. Use context and meaning to extract fields
3. Handle variations: "Experience" vs "Minimum Qualification" vs "Requirements"
4. Infer missing fields from context when reasonable
5. NEVER leave a critical field empty - use context or mark "Not specified"

📍 FIELD EXTRACTION GUIDE:

job_title: Extract the actual job position/role
  - Look for: "Role:", "Position:", "Job Title:", "Hiring for", "Opening for"
  - Or: The main heading/first mention in JD
  - Handle variations: "Senior DevOps Engineer", "ML Engineer (Fresher)", "Manager - Sales"
  - NEVER empty

experience_required: Years/seniority level needed
  - Look for: "Experience:", "Minimum Qualification:", "Years Required:", "Level:"
  - Handle ALL formats: "0-1 years", "1-3 yrs", "Fresher", "Entry-Level", "2+ years"
  - Handle special chars: "0–1 years", "5+", "Senior (5-10 years)"
  - NEVER empty - infer from job title if needed

location: Work location(s) and mode
  - Look for: "Location:", "City:", "Based:", "Work from:", "Office", "Remote"
  - Handle combinations: "Bangalore (Hybrid)", "NYC/Remote", "Bangalore, Pune, or Remote"
  - NEVER empty

education: Educational requirements
  - Look for: "Education:", "Qualification:", "Degree:", "Required Education"
  - Handle variations: "B.Tech/B.E in CS", "Bachelor's", "Any Bachelor", "MBA preferred"
  - NEVER empty

salary_range: Compensation offered
  - Look for: "Salary:", "CTC:", "Package:", "Compensation:", "Budget"
  - Handle formats: "₹3-6 LPA", "$80K-120K", "Competitive", "50K-100K per month"
  - NEVER empty - use "Competitive" if specific salary missing

required_skills: ONLY required/mandatory skills
  - Extract from "Required Skills", "Must Have", "Mandatory"
  - DON'T include "Nice to Have" or "Preferred"

responsibilities: Key job duties
  - Extract from "Responsibilities", "Duties", "Will Do", "Key Responsibilities"

keywords: Important technical/domain terms from entire JD

⚠️ RULES:
1. Extract ONLY what's explicitly stated or strongly implied
2. DO NOT hallucinate details
3. Always return clean, normalized values
4. Be consistent and structured
5. Return ONLY valid JSON

STEP 2: Compare every candidate on skills (60%) + experience (25%) + domain (15%).

STEP 3: Simulate recruiter-candidate chat (6-8 exchanges).

STEP 4: Calculate Interest Score from interest, notice period, salary fit, location fit.

STEP 5: Final Score = (Match Score × 0.7) + (Interest Score × 0.3). Sort descending.`,
        },
        {
          role: "user",
          content: `Job Description:\n${jd}\n\nCandidates JSON:\n${JSON.stringify(candidates)}`,
        },
      ],
      scoutTool,
    );

    const results = (scouting.results ?? []).sort((a: any, b: any) => b.final_score - a.final_score);

    // Extract fields directly from JD text as fallback (follows core extraction rules)
    const extracted = extractJDFields(jd);
    const jd_parsed = scouting.jd_parsed ?? {};

    // Validate: use AI response if present, fallback to extracted text, else "Not specified"
    const validated_jd = {
      job_title: jd_parsed.job_title?.trim() || extracted.job_title,
      experience_required: jd_parsed.experience_required?.trim() || extracted.experience_required,
      location: jd_parsed.location?.trim() || extracted.location,
      education: jd_parsed.education?.trim() || extracted.education,
      salary_range: jd_parsed.salary_range?.trim() || extracted.salary_range,
      required_skills: (Array.isArray(jd_parsed.required_skills) && jd_parsed.required_skills.length > 0) 
        ? jd_parsed.required_skills 
        : [],
      responsibilities: (Array.isArray(jd_parsed.responsibilities) && jd_parsed.responsibilities.length > 0) 
        ? jd_parsed.responsibilities 
        : [],
      keywords: (Array.isArray(jd_parsed.keywords) && jd_parsed.keywords.length > 0) 
        ? jd_parsed.keywords 
        : [],
    };

    return new Response(JSON.stringify({ jd_parsed: validated_jd, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const status = e.status === 429 ? 429 : e.status === 402 ? 402 : 500;
    const msg =
      status === 429 ? "Rate limit hit. Please try again in a moment." :
      status === 402 ? "AI credits exhausted. Add funds in Lovable Cloud → Workspace → Usage." :
      e.message ?? "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});