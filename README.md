# AI Time-Block Scheduler  
### CS4990 Prompt Engineering Final Project – Kareem Anabtawi  

> People spend more time planning their day than actually doing it — this AI automates the process

---

## Overview
The **AI Time-Block Scheduler** is a Next.js + Gemini API web application that automatically builds **personalized, conflict-free daily schedules** based on user-entered tasks, anchors, availability, and focus preferences.  
It demonstrates how **prompt engineering** can enhance the reliability and usefulness of a Generative AI system.

---

## Problem Statement
Many students and professionals waste hours manually creating schedules using tools like Google Calendar or Notion.  
These apps do not understand *how* users work — they ignore focus habits, breaks, and priorities, resulting in disorganized days and burnout.  

**Goal:** create an intelligent planner that automatically generates smart, realistic schedules while respecting availability and focus limits.

---

## AI Solution
The AI Time-Block Scheduler combines **Generative AI reasoning** (Gemini API) with a **deterministic local planner** to:

- Build schedules from natural-language-like task inputs  
- Respect anchors (fixed events such as lectures or meetings)  
- Insert breaks and enforce minimum spacing between tasks  
- Distribute work evenly across available days  
- Guarantee valid ISO-8601 time output even when AI fails  

---

## Tech Stack
| Layer | Technology |
|-------|-------------|
| **Frontend** | Next.js 14 (React, TypeScript, Tailwind) |
| **Backend API** | Gemini API (Google Generative AI) + local fallback planner |
| **Validation** | Zod Schemas for Plan and ScheduleRequest |
| **Deployment** | Vercel / Localhost |
| **Language** | TypeScript (Edge Runtime) |

---

## Prompt Engineering Techniques Used
| Technique | Purpose | Example in Project |
|------------|----------|--------------------|
| **Persona Pattern** | Instructs Gemini to behave as a *professional productivity coach* who generates structured, optimized schedules. | `systemPrompt` defines AI role and tone. |
| **Few-Shot Learning** | Provides example user/assistant pairs so Gemini learns the expected JSON Plan format. | `fewShotUser1` + `fewShotAssistant1` used in `/lib/prompt.ts`. |
| **Iterative Refinement** | Validates and corrects AI output to ensure reliability. | If Gemini returns invalid JSON, `localPlan()` fixes it automatically. |

---

## Project Structure
```
app/
 └─ api/
     └─ schedule/
         └─ route.ts              # Core API route (Gemini API + local fallback planner)

lib/
 ├─ schema.ts                     # Zod validation for Plan and ScheduleRequest
 ├─ prompt.ts                     # System + few-shot prompt definitions
 ├─ gemini.ts                     # Gemini API helper (JSON generation + parsing)
 └─ utils.ts                      # Misc. helper functions (if any)

components/
 ├─ HeroTemplate.tsx              # Header + summary text
 ├─ ScheduleView.tsx              # Calendar / timeline view
 ├─ HomeSections.tsx              # Wrapper for home page content
 └─ Forms/
     ├─ TaskForm.tsx              # Task input form
     ├─ AnchorForm.tsx            # Fixed meetings input form
     ├─ AvailabilityForm.tsx      # Availability input form
     └─ PreferencesForm.tsx       # Focus, break, and limit settings

styles/
 └─ globals.css                   # Tailwind / global styling

public/
 └─ favicon.ico                   # App icon
```
## How It Works
1. **User Input → API:** User enters tasks, anchors, and preferences.  
2. **AI Processing:** The `/api/schedule` route sends the request to the Gemini API.  
3. **Validation:** If Gemini’s JSON fails schema validation, a **local planner** rebuilds it conflict-free.  
4. **Output:** A clean ISO-formatted schedule is returned and rendered visually in the calendar UI.

---

## Demo Instructions
1. Run locally or open deployed link.  
2. Add Tasks + Anchors + Availability + Preferences.  
3. Click **“Generate Schedule.”**  
4. The app displays color-coded blocks:  
   - 🟩 Tasks                      
   - 🟦 Anchors                    
   - 🟨 Breaks                    

🎥 A short demo video (3-5 minutes) is included in the submission.

---

## Key Features
- Automatic time-block generation  
- Spacing and daily cap logic (min gaps, max tasks per day)  
- Gemini integration with JSON schema enforcement  
- Fallback planner for 100% uptime and valid output  
- Intuitive UI with clear visual schedule  

---

## UI/UX Highlights
- Responsive React layout with color-coded events  
- Simple form sections for Tasks, Anchors, Availability, and Preferences  
- Instant visual feedback after generation  
- Clean modern style optimized for desktop and mobile  

---

## Impact & Future Work
**Impact:** Automates time management and reduces stress for students and professionals.  

**Future Plans:**
- Integration with Google Calendar API  
- Voice input for hands-free scheduling  
- Smart recommendations (“best focus hours”)  
- Team mode for shared projects  
---

## Setup & Run
```bash
# 1️⃣ Clone repository
git clone https://github.com/yourusername/ai-time-block-scheduler.git
cd ai-time-block-scheduler

# 2️⃣ Install dependencies
npm install

# 3️⃣ Set environment variables
# In a .env.local file:
GEMINI_API_KEY=your_api_key_here

# 4️⃣ Run development server
npm run dev
