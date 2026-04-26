# Talent Compass

Talent Compass is an AI-powered recruitment platform that automates JD parsing, candidate matching, scoring, and simulated recruiter interaction.

It helps recruiters:

📄 Upload Job Descriptions (any format)
📊 Upload candidate data (CSV/JSON)
🤖 Get AI-based ranking with explainability
💬 View simulated recruiter-candidate conversations
🎯 Make faster and smarter hiring decisions
<img width="757" height="1586" alt="mermaid-diagram" src="https://github.com/user-attachments/assets/0cd55798-f214-4fe7-83be-9c5bb5283a45" />

⚙️ System Architecture

🔹 Frontend

Built with React + Tailwind CSS
Handles:
JD input
Candidate upload
Results display
Chat transcript UI

🔹 Backend

Built with Node.js (Express)
Responsible for:
JD parsing
Candidate matching
Score calculation
API handling

🔹 Database

Supabase
Stores:
Candidate profiles
Scores
Chat transcripts

🔹 AI Components

Recruiter AI
Simulates recruiter behavior
Chat Simulation Engine
Generates recruiter ↔ candidate conversation
Scoring Engine
Assigns ranking with explainability

🧠 Scoring / Logic Description

The system evaluates candidates using a multi-factor scoring model:

🔹 1. Skill Matching (40%)

Compares JD skills with candidate skills
Uses keyword + semantic matching

🔹 2. Experience Matching (20%)
Checks if candidate experience fits JD requirements

🔹 3. Project Relevance (15%)
Evaluates similarity of candidate projects with job role

🔹 4. Location & Availability (10%)
Matches job location / remote preference
Considers notice period

🔹 5. Behavioral Analysis (15%)
Based on simulated chat:
Communication clarity

🤖 AI Interaction (Simulated)

Currently:

Both recruiter and candidate are AI-generated
Used for:
Testing system
Generating insights
Improving scoring

Tech Stack

Frontend: React, Tailwind CSS
Backend: Node.js, Express
Database: Supabase
AI: OpenAI API

Future Scope:

Real user ↔ AI recruiter interaction

Live interview simulation
🌟 Key Features
✅ Works with any JD format (emoji/no emoji)
✅ AI-powered candidate ranking
✅ Explainable matching
✅ Simulated recruiter chat
✅ Real-time UI
<img width="1920" height="1020" alt="Screenshot 2026-04-26 220209" src="https://github.com/user-attachments/assets/e9f30286-0e4e-4e85-b3ed-4118620527d6" />
<img width="1920" height="1020" alt="Screenshot 2026-04-26 220315" src="https://github.com/user-attachments/assets/5f21afcf-4405-41c4-a45a-1f219c6f32ad" />
<img width="1920" height="1020" alt="Screenshot 2026-04-26 220335" src="https://github.com/user-attachments/assets/c2cc3ab4-4039-4725-88c6-31b00b080634" />


