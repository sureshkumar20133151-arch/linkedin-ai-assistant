# Project Context: Personal LinkedIn AI Assistant

This document serves as a comprehensive briefing for any AI assistant or developer working on this codebase in a new session.

---

## 📌 Project Overview
**Personal LinkedIn AI Assistant** is a high-productivity **Manifest V3 Chrome Extension** paired with a **Node.js / Express backend** powered by **Google Gemini AI** (`gemini-2.5-flash`).

It acts as an intelligent assistant on LinkedIn to:
1. **Inject AI Comment Toolbars** directly into active comment composers.
2. **Extract Post Context** (author, post text, media context) while ensuring strict post isolation.
3. **Generate Context-Aware Comments** (`Professional`, `Insightful`, `Short`, or custom instructions) tailored to the user's personal developer profile and saved behavior rules.
4. **Direct Editor Insertion** into LinkedIn's Draft.js/Slate DOM editor automatically.
5. **Assist with LinkedIn Direct Messages** via message extraction & AI reply suggestions.

---

## 📂 Repository Structure & Key Components

```text
linkedin-personal-assistant/
├── README.md                 # Setup & usage instructions
├── PROJECT_CONTEXT.md        # AI & Developer Handoff Context (This File)
├── extension/                # Chrome Extension (Manifest V3)
│   ├── manifest.json         # Extension permissions & content script declarations
│   ├── background.js         # Service worker for API proxying & message routing
│   ├── content.js            # Main content script entry point & DOM orchestrator
│   ├── content.css           # Styling for injected toolbars & notifications
│   ├── messaging.js          # Handles direct messaging AI integrations
│   ├── ai/
│   │   └── api.js            # Client-side API caller to backend (/api/generate-comment, etc.)
│   ├── linkedin/
│   │   ├── selectors.js          # DOM selectors for LinkedIn posts & comment boxes
│   │   ├── postExtractor.js      # Context extraction for target posts
│   │   ├── commentInserter.js    # Automates input into Slate/Draft.js contenteditable elements
│   │   ├── detector.js           # Observer & listener for LinkedIn comment box creation
│   │   ├── messageSelectors.js   # Selectors for DM conversation threads
│   │   ├── messageExtractor.js   # Context extractor for DMs
│   │   └── messageDetector.js   # Observer for DM composer boxes
│   ├── options/              # Extension settings page (Profile & Saved Assistant Rules)
│   ├── popup/                # Extension toolbar popup (Backend status, quick toggles)
│   ├── shared/
│   │   └── config.js         # Backend endpoint URL & default settings
│   └── ui/
│       └── toolbarHelpers.js # DOM generator for the injected AI comment toolbar
└── server/                   # Node.js Express Backend
    ├── server.js             # Express app entry point (supports local & Vercel deployment)
    ├── vercel.json           # Vercel serverless deployment config
    ├── .env.example          # Environment variable template
    ├── routes/
    │   ├── comment.js        # POST /api/generate-comment
    │   ├── assistant.js      # POST /api/assistant/interact
    │   └── message.js        # POST /api/generate-message
    ├── services/
    │   └── gemini.js         # Google Gemini REST API integration
    ├── prompts/
    │   ├── commentPrompts.js # Prompt engineering for tone, isolation, and relevancy
    │   └── assistantPrompts.js # Behavior & rule interpretation prompts
    └── utils/                # Helper utilities
```

---

## 🛠️ Key Technical Architecture

### 1. Chrome Extension (Frontend / Content Scripts)
- **Manifest Version:** V3
- **Permissions:** `storage`, `activeTab`, `tabs`, `scripting`
- **Host Permissions:** `https://*.linkedin.com/*`, `https://*.vercel.app/*`
- **DOM Automation:** Detects LinkedIn comment boxes (`detector.js`), extracts strictly isolated post text (`postExtractor.js`), and injects custom HTML toolbar (`toolbarHelpers.js`).
- **Text Insertion:** `commentInserter.js` triggers `beforeinput` / `input` events on LinkedIn's contenteditable element so React/Slate registers state change seamlessly.

### 2. Backend Server (Node.js Express)
- **Framework:** Express (Node v18+)
- **AI Service:** `@google/genai` or direct Gemini REST API calls via `services/gemini.js`
- **Model:** `gemini-2.5-flash` (or configured via `process.env.GEMINI_MODEL`)
- **Key API Endpoints:**
  - `GET /api/health` — Checks status and confirms if `GEMINI_API_KEY` is present.
  - `POST /api/generate-comment` — Accepts `{ postText, authorName, tone, profile, savedRules, customInstruction }`.
  - `POST /api/assistant/interact` — Processes natural language instructions for updating behavior rules in storage.
  - `POST /api/generate-message` — Generates reply suggestions for LinkedIn DMs.
- **Deployment:** Supports local development (`node server.js` on port `3000`) and Serverless on Vercel.

---

## 🛡️ Anti-Spam & User Safety Rules

1. **No Automatic Posting:** The extension NEVER clicks LinkedIn's "Post" or "Send" buttons automatically. The user must review, optionally edit, and click post manually.
2. **Relevancy Safeguard:** Non-technical, sports, or political posts trigger a `SKIP` recommendation to prevent awkward or spammy promotional comments.
3. **No Fabricated Facts:** Prompts strictly instruct Gemini never to invent fake work experience, clients, or awards for the user.

---

## ⚙️ Local Development Setup

1. **Backend:**
   ```bash
   cd server
   pnpm install # or npm install
   cp .env.example .env # Add GEMINI_API_KEY
   node server.js
   ```
2. **Extension:**
   - Open `chrome://extensions` in Chrome.
   - Turn on **Developer Mode**.
   - Click **Load unpacked** and select the `extension/` directory.

---

## 🤖 Instructions for AI Assistants in New Sessions

- **Context Reading:** Always refer to `extension/` for DOM insertion or content script logic, and `server/` for API, Gemini prompts, and endpoint logic.
- **Testing:** Make sure to check `server/server.js` and `extension/shared/config.js` when modifying API URLs or backend headers.
- **LinkedIn DOM:** Remember that LinkedIn uses dynamic class names and contenteditable elements (Draft.js/Slate); always maintain defensive fallback selectors in `extension/linkedin/selectors.js`.
