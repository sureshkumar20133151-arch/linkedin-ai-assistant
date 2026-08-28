# Personal LinkedIn AI Assistant — Chrome Extension + Gemini Backend

A complete, high-productivity Chrome Extension and Node.js backend powered by Google Gemini. Acting as your personal assistant on LinkedIn, it detects active comment composers, reads the exact context of the post you are viewing, combines it with your personal developer profile and saved behavior instructions, and generates context-aware comments (`Professional`, `Insightful`, `Short`) directly inside LinkedIn's comment box.

---

## ✨ Features & Highlights

- **Direct LinkedIn DOM Integration**: Automatically injects a stylish toolbar (`✨ AI Comment` | `[ Professional ]` `[ Insightful ]` `[ Short ]`) whenever you click LinkedIn's native "Comment" button.
- **Strict Post Isolation**: Associates your comment strictly with the post being commented on (e.g. Post C on a search results page), preventing context bleeding from adjacent posts.
- **Personal Developer Profile**: Knows your role (`Website Developer`), skills, services, target audience, and communication tone. Never fabricates fake experience or client history.
- **Assistant Behavior Memory**: Chat with your assistant in natural language (e.g. *"Don't use emojis"*, *"Don't start comments with Great post"*, *"Keep comments natural"*) to permanently store custom rules.
- **Direct Editor Insertion**: Automatically populates LinkedIn's Draft.js/Slate contenteditable comment box without manual copy/pasting.
- **Copy Fallback**: Includes a `[ Copy Comment ]` fallback button if LinkedIn DOM changes block automatic insertion.
- **Irrelevant Post Protection**: Automatically identifies sports, entertainment, politics, or non-tech posts and displays a `SKIP` notification instead of forcing a fake web development comment.
- **No Auto-Posting / Anti-Spam**: The assistant **never** submits or posts automatically. You always retain 100% control to review, edit, and manually click LinkedIn's "Post" button.

---

## 🛠️ System Requirements

- **Node.js**: v18.0.0 or higher
- **Google Gemini API Key**: Free or paid API key from [Google AI Studio](https://aistudio.google.com/)
- **Google Chrome**: Or any Chromium-based browser (Brave, Edge, Opera)
- **LinkedIn Account**

---

## 🚀 Quick Start Guide

### Step 1: Set Up & Start the Backend Server

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   pnpm install
   # Or using npm:
   npm install --no-workspaces
   ```

3. Configure your Environment Variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and paste your Google Gemini API key:
     ```env
     GEMINI_API_KEY=your_actual_gemini_api_key_here
     GEMINI_MODEL=gemini-2.5-flash
     PORT=3000
     ```

4. Start the server:
   ```bash
   node server.js
   ```
   *You should see:*
   ```text
   🚀 Personal LinkedIn AI Assistant Backend Running!
   📍 URL: http://localhost:3000
   🔑 Gemini Key Status: CONFIGURED ✅
   ```

---

### Step 2: Load Chrome Extension in Developer Mode

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Toggle **Developer Mode** in the top right corner.
3. Click **Load unpacked** in the top left corner.
4. Select the `extension/` folder in this repository:
   `c:\Users\Suresh\Documents\Antigravity\linkedin personal assistant\extension`
5. The extension badge `✨ Personal LinkedIn AI Assistant` will appear in your extensions list.

---

### Step 3: Configure Settings & Assistant Behavior

1. Click the Extension icon in your Chrome toolbar or right-click it and choose **Options**.
2. **My Profile**: Customize your developer role, skills, services, and target audience. Click **Save Profile**.
3. **🧠 Assistant Behavior**: Type instructions to your assistant (e.g., *"Don't use emojis and keep comments under two sentences"*). The assistant will acknowledge and save your preferences to its memory.
4. **Saved Rules**: Enable, edit, or delete stored rules anytime.

---

### Step 4: Use on LinkedIn

1. Open [LinkedIn](https://www.linkedin.com/) and search for a requirement query, such as:
   - `website developer`
   - `looking for website developer`
   - `need website developer`
2. Scroll to any post and click LinkedIn's native **Comment** button.
3. The AI Assistant toolbar will appear right inside the comment composer:
   ```text
   ┌───────────────────────────────────────────────────────────┐
   │ ✨ AI Comment                                             │
   │ [ Professional ] [ Insightful ] [ Short ]                │
   │ [ One-time instruction (optional)...                  ]   │
   └───────────────────────────────────────────────────────────┘
   ```
4. Click **Professional**, **Insightful**, or **Short**.
5. Watch the comment populate automatically in the LinkedIn comment box.
6. Review/edit the text and manually click LinkedIn's native **Post** button when ready.

---

## 🔒 Permissions & Security

- `storage`: Saves your persona profile and behavior preferences locally in Chrome Storage.
- `activeTab` & `host_permissions`: Accesses `https://*.linkedin.com/*` to detect comment boxes and `http://localhost:3000/*` to communicate with your local backend.
- **Privacy Assurance**: The Gemini API key remains strictly on your local Node.js server (`server/.env`). It is **never** embedded in extension code or sent to the browser.

---

## ❓ Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Backend Offline" status** | Ensure the Node backend is running (`node server.js` in `server/`) on `http://localhost:3000`. |
| **"GEMINI_API_KEY is not configured"** | Open `server/.env` and replace `your_gemini_api_key_here` with your actual key from Google AI Studio. |
| **Comment didn't insert automatically** | Click the `[ Copy Comment ]` fallback button on the toolbar notice and paste manually into LinkedIn's editor. |
| **Extension toolbar not appearing** | Refresh the LinkedIn tab after loading unpacked extension. Ensure Chrome Developer mode is enabled. |

---

## 📄 License & Architecture

Designed for personal productivity and extensible for multi-user SaaS integration. Built with Node.js Express, Google Gemini REST API, Vanilla CSS, and Manifest V3.
