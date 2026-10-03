<div align="center">

# ⚡ AceInterview.ai

### Next-Generation AI Technical Interviewer & Career Co-Pilot

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-aceinterview--ai.vercel.app-00DC82?style=for-the-badge&logo=vercel&logoColor=white)](https://aceinterview-ai.vercel.app)
[![Next.js 15+](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**Simulate realistic engineering interviews, practice with dynamic voice avatars, receive granular diagnostics, and land high-paying software jobs.**

[Explore Live Demo](https://aceinterview-ai.vercel.app) · [Report Bug](https://github.com/vamshichethan/AceInterview/issues) · [Request Feature](https://github.com/vamshichethan/AceInterview/issues)

</div>

---

## 🚀 Live Deployment

The application is deployed and live on Vercel:
👉 **[https://aceinterview-ai.vercel.app](https://aceinterview-ai.vercel.app)**

---

## 🌟 Key Highlights

### 🎙️ 1. Interactive Voice & Avatar Interviewer
- **Realistic Human Avatar**: Animated video interviewer with natural speaking cadence and active listening expressions.
- **Bi-Directional Voice Dialogue**: Speak directly to the interviewer using real-time Web Speech recognition and audio synthesis.
- **Intelligent Interruption & Follow-ups**: The AI pauses when you speak, listens to your reasoning, and asks dynamic clarifying questions just like a Senior Staff Engineer.

### 📄 2. Resume-Tailored Question Generation
- Upload your resume (PDF) to automatically customize the interview.
- Gemini 2.5 parses previous work experience, project stacks, and system architecture to generate questions specific to your real background.
- Select your target role: **Frontend, Backend, Full Stack, DevOps/Cloud, Mobile, Data Engineering, or Machine Learning**, with tailored seniority tiers (*Intern, Fresher, Mid-Level, Senior*).

### 📊 3. Deep Diagnostic Feedback & Radar Analytics
- **Multi-Vector Scoring**: Evaluates Communication Clarity, Technical Accuracy, Problem Solving, and System Architecture.
- **Detailed Transcript Breakdown**: Review every question-and-answer turn with actionable feedback, what you did well, and what to say next time.
- **Interactive Visualizations**: Radar charts and benchmark comparison powered by **Recharts**.

### 💼 4. Real-World Tech Hiring & Jobs Board
- Integrated feeds with live job listings from top hiring platforms (Adzuna, GitHub Jobs, Tech Feeds).
- Auto-matches recommended roles based on your strongest scores in the mock interview.
- One-click application direct to company career portals.

### 🎥 5. Curated Video Masterclasses & Roadmaps
- Track-aware YouTube video masterclasses with a dynamic 12-hour subtopic rotation.
- Direct links to top-starred open-source GitHub curriculum repositories for deep-dive study.

### 💳 6. Flexible Subscription & UPI Payment Ledger
- Supports Razorpay and instant 12-digit UPI UTR verification.
- **Super Admin Dashboard**: Full admin panel to monitor platform metrics, review users, verify UPI transaction UTRs, and manage access tiers.

---

## 🛠️ Architecture & Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) (App Router, Turbopack) | Server Components, dynamic API routes, edge-ready rendering |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Type-safe end-to-end schemas |
| **AI Models** | [Google Gemini 2.5 Flash](https://ai.google.dev/) | Multi-key failover pool with automatic load-balancing & rate-limit recovery |
| **Speech AI** | [Groq Whisper](https://groq.com/) & Web Speech API | High-accuracy transcription and synthesized voice replies |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern sleek dark-mode glassmorphic interface with micro-interactions |
| **Database** | [Supabase](https://supabase.com/) & Serverless Dual Mock-DB | Real-time session persistence, profile sync, and mock fallback |
| **Payments** | [Razorpay](https://razorpay.com/) & Manual UPI Ledger | Automated gateway + manual 12-digit UTR approval workflow |
| **Analytics** | [Recharts](https://recharts.org/) | Responsive radar and bar charts for candidate evaluation |
| **Deployment** | [Vercel](https://vercel.com/) | Global edge network with automatic CI/CD deployment |

---

## 📂 Project Structure

```bash
AceInterview/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Login, Signup, Reset Password
│   │   ├── admin/dashboard/    # Super Admin Metrics & UPI Ledger
│   │   ├── api/
│   │   │   ├── auth/           # OTP verification, JWT session handler
│   │   │   ├── evaluate/       # Multi-vector interview score evaluation
│   │   │   ├── interviewer/    # Interactive voice avatar dialogue
│   │   │   ├── jobs/           # Live tech hiring feeds
│   │   │   ├── learning/       # YouTube masterclasses & GitHub repos
│   │   │   └── transcribe/     # Audio processing & speech-to-text
│   │   ├── jobs/               # Real-world jobs board
│   │   ├── learn/              # Masterclasses and roadmaps hub
│   │   ├── student/
│   │   │   ├── interview/[id]/ # Real-time voice interview chamber
│   │   │   ├── report/[id]/    # Diagnostic report & analytics radar
│   │   │   └── setup/          # Interview configuration & resume parsing
│   │   ├── layout.tsx          # Root layout with navbar & providers
│   │   └── page.tsx            # High-conversion landing page
│   ├── components/             # Reusable UI components (HumanInterviewer, Navbar, etc.)
│   ├── hooks/                  # Custom hooks (useVoiceInterview, etc.)
│   └── lib/                    # Gemini client, Supabase client, mock-db, utilities
├── data/
│   └── ace_interview_db.json   # Local serverless fallback state & mock storage
├── public/                     # Static media, avatar frames, logos
└── package.json
```

---

## ⚡ Getting Started Locally

### Prerequisites
- **Node.js**: v18.18 or higher (v20+ recommended)
- **npm** or **pnpm** / **yarn**

### 1. Clone the Repository
```bash
git clone https://github.com/vamshichethan/AceInterview.git
cd AceInterview
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# Gemini API Key (or comma-separated pool for automatic failover)
GEMINI_API_KEY=your_gemini_api_key_here

# Groq Whisper (Optional fallback speech-to-text)
GROQ_API_KEY=your_groq_api_key_here

# Supabase (Optional for cloud sync)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">

Built with ❤️ by [vamshichethan](https://github.com/vamshichethan)

⭐ If you find this project helpful, please consider giving it a star on [GitHub](https://github.com/vamshichethan/AceInterview)!

</div>
