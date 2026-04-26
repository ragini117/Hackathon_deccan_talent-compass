import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is working 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({
    status: "ok",
    message: "API is working",
    endpoints: ["/api/scout", "/api/outreach"],
    openai_configured: !!process.env.OPENAI_API_KEY,
  });
});

app.get("/api/health", async (req, res) => {
  try {
    // Test OpenAI connection
    const testResponse = await openai.models.list();
    res.json({
      status: "healthy",
      openai: "connected",
      models_available: testResponse?.data?.length ?? 0,
    });
  } catch (err) {
    res.status(500).json({
      status: "unhealthy",
      openai: "disconnected",
      error: err.message,
    });
  }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Verify OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY environment variable is not set!");
  console.error("Set it in .env or your environment before starting the server.");
  process.exit(1);
} else {
  console.log("✅ OpenAI API key is configured");
}

/**
 * Extract JD fields directly from raw text - FALLBACK ONLY
 * Used if AI doesn't populate fields
 * RULES: Only extract explicitly stated info, no hallucination, normalize values
 */
function extractJDFieldsBackend(jd) {
  const extractField = (patterns, defaultVal = "Not specified") => {
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
      /(?:📌\s*Role|Role:|Job Title:|Position:|Post:|We are looking for|Hiring for|Opening for)\s*:?\s*([^\n]+)/i,
      /^[A-Z][A-Za-z\s/(),-]+(?:Engineer|Developer|Manager|Analyst|Specialist|Lead|Architect)\b/m,
    ]),

    experience_required: extractField([
      /(?:📌\s*Experience|Experience:|Minimum Experience|Exp\.|Years Required|Level:)\s*:?\s*(.+?)(?:\n|$)/i,
      /(?:fresher|entry[\s-]?level|junior|mid[\s-]?level|senior|\d+[\s-]*(?:to|\+|–|-|~)\s*\d+\s*years?|\d+[\s+-]*years?)/i,
    ]),

    location: extractField([
      /(?:📌\s*Location|Location:|City:|Based|Work from|Office Location)\s*:?\s*([^\n]+)/i,
      /(?:location|city|based|work[\s-]?(?:from|location)|office):\s*([^\n]+)/i,
    ]),

    education: extractField([
      /(?:🎓\s*Education|Education:|Qualification:|Degree:|Required Education)\s*:?\s*(.+?)(?:\n|$)/i,
      /(?:education|degree|qualification|B\.?E\.?|B\.?Tech|B\.?Sc|M\.?Tech|MBA|MCA)[\s:]*([^\n]+)?/i,
    ]),

    salary_range: extractField([
      /(?:📊\s*Salary|Salary:|CTC:|Package:|Compensation:|Budget:|Pay:)\s*:?\s*(.+?)(?:\n|$)/i,
      /(?:salary|ctc|compensation|package|budget|pay):\s*(.+?)(?:\n|$)/i,
    ]),
  };
}

app.post("/api/scout", async (req, res) => {
  try {
    const { jd, candidates } = req.body;

    if (!jd || typeof jd !== "string" || !jd.trim()) {
      return res.status(400).json({ error: "JD must be a non-empty string" });
    }

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ error: "Candidates array cannot be empty" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert Job Description Parser, AI Talent Scouting Agent, AND Recruiter Conversationalist.

🎯 YOUR PRIMARY TASKS:
1. Parse JD fields intelligently from ANY format
2. Score candidates on skill/experience/domain match
3. Simulate a recruiter outreach and determine interest
4. Extract candidate expectations (salary, notice period, location)

═══════════════════════════════════════════════════════════════
📍 PART 1: JD EXTRACTION (AI-FIRST)
═══════════════════════════════════════════════════════════════

Your job is to intelligently parse JD regardless of format:
- Labeled sections (Role:, Experience:, etc.)
- Paragraph text (unstructured)
- LinkedIn/Naukri copied format
- Messy or incomplete text
- Multiple formats mixed together

🔍 EXTRACTION INSTRUCTIONS:
1. Read the ENTIRE JD carefully
2. Use context and meaning to extract fields
3. Handle variations in terminology
4. Infer missing fields from context when reasonable
5. NEVER leave a critical field empty

📌 FIELD EXTRACTION GUIDE:

job_title: The actual job position/role
  - Look for: "Role:", "Position:", "Job Title:", "Hiring for", "Opening for"
  - Handle: "Senior DevOps Engineer", "ML Engineer (Fresher)", "Manager - Sales"

experience_required: Years/seniority level needed
  - Look for: "Experience:", "Minimum Qualification:", "Years Required:", "Level:"
  - Handle ALL formats: "0-1 years", "1-3 yrs", "Fresher", "Entry-Level", "2+ years"
  - Handle special chars: "0–1 years", "5+", "Senior (5-10 years)"

location: Work location(s) and mode
  - Look for: "Location:", "City:", "Based:", "Work from:", "Office", "Remote"
  - Handle combinations: "Bangalore (Hybrid)", "NYC/Remote"

education: Educational requirements
  - Look for: "Education:", "Qualification:", "Degree:", "Required Education"
  - Handle: "B.Tech/B.E in CS", "Bachelor's", "Any Bachelor", "MBA preferred"

salary_range: Compensation offered
  - Look for: "Salary:", "CTC:", "Package:", "Compensation:", "Budget"
  - Handle: "₹3-6 LPA", "$80K-120K", "Competitive", "50K-100K per month"

required_skills: ONLY required/mandatory skills
  - Extract from "Required Skills", "Must Have", "Mandatory"
  - Examples: Python, AWS, React, SQL, etc.

responsibilities: Key job duties
  - Extract from "Responsibilities", "Duties", "Will Do"

keywords: Important technical/domain terms from entire JD

═══════════════════════════════════════════════════════════════
📊 PART 2: CANDIDATE MATCHING & SCORING
═══════════════════════════════════════════════════════════════

For EACH candidate, calculate THREE match scores (0-100):

⚙️ SKILL MATCH (0-100):
- Compare candidate's skills vs required_skills
- 80-100: Has 90%+ required skills
- 60-79: Has 70-89% required skills
- 40-59: Has 50-69% required skills
- 20-39: Has 30-49% required skills
- 0-19: Has <30% required skills

📅 EXPERIENCE MATCH (0-100):
- Compare candidate's experience vs experience_required
- 80-100: Meets or exceeds requirement
- 60-79: Close to requirement (±1 year)
- 40-59: Somewhat below (2-3 years difference)
- 20-39: Significantly below
- 0-19: Way below requirement

🎓 DOMAIN MATCH (0-100):
- Does their background align with the domain?
- Extract domain from keywords/skills/responsibilities
- 80-100: Strong domain experience
- 60-79: Some domain experience
- 40-59: Adjacent domain experience
- 20-39: Little domain experience
- 0-19: No domain experience

match_score = (skill + experience + domain) / 3

📋 Generate match_reasoning explaining the score:
- "Strong match: Has Python, AWS (80% of required skills), 5 years experience exceeds 2-3 year requirement, strong AI/ML domain experience"
- "Moderate match: Good with React but lacks TypeScript, 2 years exp for 3-5 year role, growing domain skills"

═══════════════════════════════════════════════════════════════
💬 PART 3: SIMULATED RECRUITER OUTREACH
═══════════════════════════════════════════════════════════════

For EACH candidate, simulate a brief recruiter-candidate conversation:

RECRUITER CONVERSATION FLOW:
1. Friendly outreach (1 message)
2. Candidate responds about interest
3. Recruiter explains opportunity
4. Candidate states salary/location/notice expectations
5. Final interest confirmation

INTEREST DETERMINATION:
- HIGH interest ("Yes"): Strong skill match (70+) + domain fit + reasonable expectations
- MEDIUM interest ("Maybe"): Moderate match or high skill but some gaps
- LOW interest ("No"): Low match score (<40) + unlikely to respond

interest_score = (match_score * 0.6) + (domain_relevance * 0.2) + (cultural_fit * 0.2)

interest_reasoning: Brief explanation of interest
- "Strong candidate pool member: Exceeds role requirements, excellent domain fit, likely receptive"
- "Worth considering: Has key skills but experience slightly below requirement"
- "Lower priority: Significant skill/experience gaps but could develop"

EXTRACT FROM CONVERSATION:
- notice_period: Inferred from their background or use typical (e.g., "30 days", "Immediate", "2 months")
- expected_salary: Extract from profile or infer market range slightly above current (e.g., "8-10 LPA", "Not specified")
- location_open: Yes/Maybe/No based on their location vs job location
  
GENERATE transcript: Array of recruiter/candidate messages showing conversation

final_score = (match_score * 0.7) + (interest_score * 0.3)
- This combines technical fit with likelihood to engage

═══════════════════════════════════════════════════════════════
⚠️ CRITICAL RULES:
═══════════════════════════════════════════════════════════════
1. NEVER hallucinate: Extract only from JD and candidate data
2. ALWAYS provide all required fields - no nulls
3. Be reasonable: Salary expectations should be in line with role
4. Be consistent: Don't contradict yourself in reasoning
5. Return ONLY valid JSON - no markdown, no extra text

═══════════════════════════════════════════════════════════════
✅ REQUIRED JSON SCHEMA - MUST MATCH EXACTLY:
═══════════════════════════════════════════════════════════════
{
  "parsed_jd": {
    "job_title": "string",
    "experience_required": "string",
    "location": "string",
    "education": "string",
    "salary_range": "string",
    "required_skills": ["string"],
    "responsibilities": ["string"],
    "keywords": ["string"]
  },
  "ranked_candidates": [
    {
      "name": "string",
      "match_score": number (0-100),
      "match_breakdown": {
        "skill": number (0-100),
        "experience": number (0-100),
        "domain": number (0-100)
      },
      "match_reasoning": "string explaining the match",
      "interest_score": number (0-100),
      "interest_level": "Yes" | "Maybe" | "No",
      "interest_reasoning": "string explaining interest",
      "notice_period": "string (e.g., '30 days', 'Immediate', '2 months')",
      "expected_salary": "string (e.g., '8-10 LPA', 'Market rate')",
      "location_open": "Yes" | "Maybe" | "No",
      "final_score": number (0-100),
      "transcript": [
        {
          "role": "recruiter" | "candidate",
          "message": "string"
        }
      ]
    }
  ]
}

IMPORTANT: Rank candidates by final_score DESC. Top candidates first.`,
        },
        {
          role: "user",
          content: `Job Description:\n${jd}\n\nCandidates:\n${JSON.stringify(candidates)}`,
        },
      ],
      temperature: 0.4,
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ 
        error: "Empty response from AI",
        details: "No content in OpenAI response"
      });
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseErr) {
      return res.status(500).json({ error: "Invalid JSON from OpenAI" });
    }

    if (!result.parsed_jd) {
      result.parsed_jd = {};
    }
    if (!result.ranked_candidates) {
      result.ranked_candidates = [];
    }

    const extracted = extractJDFieldsBackend(jd);
    result.parsed_jd.job_title = result.parsed_jd.job_title?.trim() || extracted.job_title;
    result.parsed_jd.experience_required = result.parsed_jd.experience_required?.trim() || extracted.experience_required;
    result.parsed_jd.location = result.parsed_jd.location?.trim() || extracted.location;
    result.parsed_jd.education = result.parsed_jd.education?.trim() || extracted.education;
    result.parsed_jd.salary_range = result.parsed_jd.salary_range?.trim() || extracted.salary_range;

    result.ranked_candidates = result.ranked_candidates.map(candidate => ({
      ...candidate,
      match_score: Math.round(candidate.match_score || 0),
      interest_score: Math.round(candidate.interest_score || 0),
      final_score: Math.round(candidate.final_score || 0),
      match_breakdown: candidate.match_breakdown ? {
        skill: Math.round(candidate.match_breakdown.skill || 0),
        experience: Math.round(candidate.match_breakdown.experience || 0),
        domain: Math.round(candidate.match_breakdown.domain || 0),
      } : { skill: 0, experience: 0, domain: 0 }
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ 
      error: "Scouting failed",
      details: err.message || "Unknown error"
    });
  }
});

app.post("/api/outreach", async (req, res) => {
  try {
    const { candidate, jd } = req.body;

    if (!candidate || !jd) {
      return res.status(400).json({ error: "Missing candidate or JD data" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an expert recruiter. Generate personalized outreach for this candidate.

Return ONLY valid JSON:
{
  "email": {
    "subject": "string",
    "body": "string"
  },
  "linkedin": "string",
  "message": "string",
  "key_talking_points": ["string"],
  "objection_handlers": {
    "salary": "string",
    "location": "string",
    "notice_period": "string"
  }
}`,
        },
        {
          role: "user",
          content: `Candidate:\n${JSON.stringify(candidate)}\n\nJob Description:\n${jd}`,
        },
      ],
      temperature: 0.7,
    });

    let result;
    try {
      result = JSON.parse(response.choices[0].message.content);
    } catch (parseErr) {
      return res.status(500).json({ error: "Invalid response format from AI" });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || "Outreach generation failed" });
  }
});

app.listen(5000, () => {
  console.log("Backend server is running at http://localhost:5000");
});