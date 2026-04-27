**Talent Compass**

Talent Compass is an AI-powered recruitment agnet that automates JD parsing, candidate matching, scoring, and simulated recruiter interaction.

It helps recruiters:

📄 Upload Job Descriptions (any format)

📊 Upload candidate data (CSV/JSON)

🤖 Get AI-based ranking with explainability

💬 View simulated recruiter-candidate conversations

🎯 Make faster and smarter hiring decisions

**🏗️ Architecture Diagram**

<img width="757" height="1586" alt="mermaid-diagram" src="https://github.com/user-attachments/assets/42be6da4-2be4-46c5-a09e-b2d544a2c77f" />

**⚙️ System Architecture**

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

🤖 Recruiter AI → Simulates recruiter behavior

💬 Chat Simulation Engine → Generates recruiter ↔ candidate conversations

🧠 Scoring Engine → Assigns ranking with explainability

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

Confidence

Problem-solving ability

🤖 AI Interaction (Simulated)

🔹 Current

Both recruiter and candidate are AI-generated

Used for:

Testing system

Generating insights

Improving scoring

🔹 Future Scope

Real user ↔ AI recruiter interaction

Live interview simulation

**🌟 Key Features**

✅ Works with any JD format (emoji / no emoji)

✅ AI-powered candidate ranking

✅ Explainable matching

✅ Simulated recruiter chat

✅ Real-time UI

✅ ✨ AI-generated outreach (LinkedIn, Email, Message)

🛠️ Tech Stack

Frontend: React, Tailwind CSS

Backend: Node.js, Express

Database: Supabase

AI: OpenAI API

<img width="1920" height="1020" alt="Screenshot 2026-04-26 220209" src="https://github.com/user-attachments/assets/70b94d57-7e07-4662-97d8-7de53cea24ed" />

<img width="1920" height="1020" alt="Screenshot 2026-04-26 220315" src="https://github.com/user-attachments/assets/54a439ee-651a-443f-8edb-3a72e3729eb5" />

<img width="1920" height="1020" alt="Screenshot 2026-04-26 220335" src="https://github.com/user-attachments/assets/59dab27b-97f5-4c4f-accb-462b74825f2c" />



