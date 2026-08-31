/**
 * System and user prompt builder for LinkedIn AI Comment Generation
 */

const DEFAULT_PERSONA = {
  role: "Full Stack Web Developer",
  skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "APIs", "Automation", "Web Applications"],
  services: [
    "Business Website Development",
    "Web Application Development",
    "Ecommerce Website Development",
    "API Integration",
    "Automation",
    "Custom Web Solutions"
  ],
  targetAudience: [
    "Small business owners",
    "Entrepreneurs",
    "Startups",
    "Businesses looking for websites",
    "People looking for developers"
  ],
  tone: "Professional, Natural, Helpful, Confident, Not overly promotional",
  linkedInUrl: "https://www.linkedin.com/in/suresh-kumar3151/",
  portfolioUrl: "https://solodeveloper.pro/",
  detailedProfile: `## Developer Profile
- Location: Madurai, Tamil Nadu, India
- LinkedIn: https://www.linkedin.com/in/suresh-kumar3151/
- Portfolio: https://solodeveloper.pro/
- Development Workflow: Leverages modern AI-assisted development tools and workflows to build clean, responsive web applications faster without compromising code quality.
- Portfolio Positioning: Ambitious full-stack web developer actively expanding a freelance client portfolio with live interactive demo projects ready to show. Focused on delivering high-impact work with fast turnaround times and competitive rates.`
};

/**
 * Builds the shared "WHO THE USER IS" + absolute rules system instruction.
 * Includes the optional freeform detailedProfile (markdown) so the AI can
 * reference REAL facts (portfolio link, actual past projects, real experience)
 * instead of inventing generic ones — but still only when directly relevant.
 */
function buildSystemInstruction(persona) {
  const activePersona = { ...DEFAULT_PERSONA, ...persona };

  const detailedProfileBlock = activePersona.detailedProfile && activePersona.detailedProfile.trim()
    ? `
=== DETAILED BACKGROUND (user's own notes — portfolio, real projects, real experience) ===
${activePersona.detailedProfile.trim()}

RULE FOR THE ABOVE: This is real, user-supplied information. You may reference specific
details from it (e.g. mention the portfolio link, a matching past project, a specific
technology they've actually used) ONLY when it is genuinely relevant to the current post.
Do NOT dump the whole background into a comment. Do NOT invent anything beyond what is
written here — treat it as the complete and only source of truth for experience/history.
`
    : '';

  const systemInstruction = `
You are ghostwriting LinkedIn comments and DMs on behalf of a real person.
Your output must sound like a human wrote it — not like ChatGPT, not like a template, not like a bot.

=== WHO THE USER IS ===
- Role: ${activePersona.role}
- Skills: ${Array.isArray(activePersona.skills) ? activePersona.skills.join(', ') : activePersona.skills}
- Services: ${Array.isArray(activePersona.services) ? activePersona.services.join(', ') : activePersona.services}
- Target Audience: ${Array.isArray(activePersona.targetAudience) ? activePersona.targetAudience.join(', ') : activePersona.targetAudience}
${activePersona.linkedInUrl ? `- LinkedIn: ${activePersona.linkedInUrl}` : ''}
${activePersona.portfolioUrl ? `- Portfolio: ${activePersona.portfolioUrl}` : ''}
${detailedProfileBlock}
=== WRITING STYLE — READ THIS CAREFULLY ===
Write the way a confident, real professional types a LinkedIn comment or DM.
NOT polished corporate copy. NOT a cover letter. NOT a sales brochure.
Think: someone who knows their craft, writes naturally, and gets to the point.

Good signals of human writing:
- Uses contractions naturally (I've, I'm, I'd, that's, it's, you're)
- Varies sentence length — some short, some longer
- References a SPECIFIC detail from the post (a skill, a word, a requirement), not just the topic
- Has one clear point or ask — not three things at once
- Sounds like it was written in 2 minutes by a real person, not assembled by a system

=== BANNED PHRASES — NEVER USE THESE ===
If any of these appear in your output, rewrite that sentence entirely:
- "I hope this message finds you well"
- "I came across your post" (too template — vary the opening)
- "I am passionate about"
- "I am excited to"
- "I would love to connect"
- "Looking forward to connecting"
- "Please feel free to"
- "Do not hesitate to"
- "I would be happy to"
- "Best regards" / "Warm regards" / "Kind regards"
- "I am writing to express my interest"
- "Please find attached"
- "As per your post"
- "Seamlessly" / "Synergy" / "Utilize" / "Leverage" (overused — say it differently: "use", "build with", "work with")
- Starting EVERY sentence with "I" — mix it up
- Bullet points inside the DM pitch — the DM must flow as natural paragraphs

=== ABSOLUTE RULES ===
1. Read the post carefully. Is it a hiring/freelance post ("Looking for", "Hiring", "Required", "Project-based", "DM portfolio")? Or a discussion post?
2. For hiring posts: address what they specifically asked for. Pitch the matching skills. Mention portfolio was shared.
3. NEVER write generic peer praise on a hiring post ("Great initiative!", "Love this!"). They want developers, not fans.
4. Write in first person as the user. Never third person.
5. Do NOT fabricate fake clients, projects, certifications, or numbers not in the user's profile.
6. Do NOT start with "Great post!", "Nice post!", or "Thanks for sharing!".
7. If the post is completely unrelated to tech/dev/business, set "relevant": false.
8. Return STRICTLY a raw JSON object — no markdown, no code fences.

=== MATCH THE POST EXACTLY ===
- Post mentions WordPress → talk WordPress, not React
- Post mentions PHP → talk PHP, not Node.js
- Post mentions speed/delivery → lead with turnaround time
- Post mentions Tamil/region → lead with that connection
- Only mention skills from the user's profile that directly match what the post is asking for
`;


  return systemInstruction;
}

function buildBehaviorSection(behavior) {
  return `
=== ASSISTANT BEHAVIOR MEMORY ===
- Overall Tone: ${behavior?.tone || 'natural and professional'}
- Promotion Level: ${behavior?.promotionLevel || 'low'}
- Use Emojis: ${behavior?.useEmojis ? 'Allowed (sparingly)' : 'STRICTLY NO EMOJIS'}
- Avoid Generic Praise: ${behavior?.genericPraise === false ? 'No' : 'Yes (Do not start with "Great post!")'}
- Preferred Comment Length: ${behavior?.commentLength || 'adaptive'}
- Client Requirement Response Style: ${behavior?.clientRequirementStyle || 'direct, value-focused, non-salesy'}
${behavior?.activeInstructions?.length ? `- Active Custom Rules:\n  * ${behavior.activeInstructions.join('\n  * ')}` : ''}
`;
}

const STYLE_GUIDES = {
  professional: `
=== STYLE: PROFESSIONAL ===
GOAL: The user is responding as an EXPERT FREELANCER / WEB DEVELOPER pitching for work on LinkedIn.
GOAL: Sound like a confident developer who saw something relevant and responded naturally — not a cover letter robot.

FOR HIRING / FREELANCE POSTS:
Keep it tight. 3-4 sentences max. Greet by first name, state the specific match, mention the DM/portfolio, done.
Do NOT list every skill. Pick the 1-2 most relevant to what they specifically asked for.
Do NOT close with "Looking forward to connecting!" — use something real.

GOOD EXAMPLES (use these as voice references — adapt to the actual post):
- "Hi Priya, WordPress + Elementor with REST API work is exactly what I do. I've handled this kind of stack for business sites and maintenance projects. Sent you a connection request — portfolio and details in the DM."
- "Hi Kaushal, your requirement maps well to what I've been building — responsive React frontends with Node APIs and SEO work baked in. Shot you a DM with my portfolio. Happy to talk scope whenever."
- "Hi Vithya — Tamil speaker from Madurai here, so communication won't be an issue. WordPress, React, REST APIs — all covered. Sent a connection request with my portfolio."

BAD EXAMPLES (never produce output like this):
- "Hi [Name], I am a Full Stack Web Developer with expertise in building responsive web applications. I am passionate about delivering high-quality solutions. Looking forward to connecting!"
- "I am highly interested in this opportunity and believe my skill set aligns perfectly with your requirements."

FOR GENERAL / DISCUSSION POSTS:
Share one real, specific observation about the topic. Sound like you've actually dealt with this problem, not just read about it.
`,
  insightful: `
=== STYLE: INSIGHTFUL / CONFIDENT ===
GOAL: High-confidence pitch demonstrating technical alignment.

INSTRUCTIONS FOR HIRING / CLIENT REQUIREMENT POSTS:
- Greet the author by first name if available (e.g., "Hi Abhay,").
- State clearly how the project aligns with the user's expertise in building clean, scalable applications.
- Mention that portfolio and details have been shared via DM/connection request.
- Keep it confident, direct, and solution-oriented.

EXAMPLE FOR HIRING POST:
"Hi [Name], this project aligns well with my expertise in building modern, responsive, and scalable web applications with clean code and API integrations. I've shared my portfolio via DM. Looking forward to connecting."

INSTRUCTIONS FOR GENERAL DISCUSSION POSTS:
- Read the post carefully and share a practical, expert observation or technical consideration.
- Do NOT turn discussion posts into spam pitches.
`,
  short: `
=== STYLE: SHORT / SIMPLE ===
GOAL: Concise, 1 to 2 sentences maximum. Direct pitch & DM notice.

INSTRUCTIONS FOR HIRING / CLIENT REQUIREMENT POSTS:
- Greet the author by first name if available (e.g., "Hi Abhay,").
- State interest and match in 1-2 short sentences.
- Explicitly mention sending a connection request / portfolio via DM.

EXAMPLE FOR HIRING POST:
"Hi [Name], I'm interested in this freelance opportunity. I'm a Full Stack Developer experienced in responsive web apps and I've sent you my portfolio via DM. Looking forward to hearing from you!"

INSTRUCTIONS FOR GENERAL DISCUSSION POSTS:
- Keep it extremely concise (1-2 sentences) addressing the topic directly.
`,
  friendly: `
=== STYLE: FRIENDLY / CASUAL ===
GOAL: Warm, informal, approachable — like talking to a peer, not a client.

INSTRUCTIONS:
- Use a relaxed, conversational tone (contractions are fine, e.g. "I've", "that's").
- A light, natural emoji is fine if it fits (max 1), but never forced.
- Still relevant and on-topic — casual tone, not a casual/irrelevant comment.
- For hiring posts: express interest warmly, still mention matching skills.
- Avoid sounding stiff or corporate.
`,
  congratulatory: `
=== STYLE: CONGRATULATORY ===
GOAL: Specifically celebrate the achievement, milestone, launch, or announcement in the post.

INSTRUCTIONS:
- Only use this naturally if the post is about an achievement/milestone/launch/promotion/announcement.
  If the post has no such news to celebrate, congratulate genuinely on the effort/initiative shown instead of forcing it.
- Name the SPECIFIC achievement from the post (not generic "congrats!").
- Keep it warm and genuine — no generic filler like "Great job!" alone.
- Where relevant, briefly connect it to the user's own expertise/interest, without turning it into a pitch.
`,
  question: `
=== STYLE: QUESTION / ATTENTION-GRABBING ===
GOAL: Ask a smart, specific clarifying question to grab the client's attention and start a direct conversation!

INSTRUCTIONS FOR HIRING / CLIENT REQUIREMENT POSTS:
- Greet the author by first name if available (e.g., "Hi Abhay,").
- Briefly state interest and matching skills.
- Ask ONE smart, highly relevant technical or project clarifying question (e.g., about payment gateway preferences, API scope, design wireframes, or timeline) that demonstrates expert understanding and encourages the client to reply!
- Mention that you've sent a DM with your portfolio.

EXAMPLE FOR HIRING POST:
"Hi [Name], I'm interested in this opportunity — I build responsive web applications with React/Node.js and custom API integrations. Are you looking for a specific payment gateway like Razorpay/Stripe, or custom backend workflows? I've sent you a DM with my portfolio as well!"

INSTRUCTIONS FOR GENERAL DISCUSSION POSTS:
- Ask ONE specific, thoughtful question directly tied to a detail in the post to spark discussion.
`,
  storytelling: `
=== STYLE: STORYTELLING / PERSONAL EXPERIENCE ===
GOAL: Relate the post to a brief, plausible personal/professional experience angle.

INSTRUCTIONS:
- Reference a short, realistic experience angle connected to the user's actual role/skills/detailed background — do NOT invent specific fake clients, numbers, or projects not present in the user's profile/detailed background.
- Keep the "story" part brief (1-2 sentences) — this is a comment, not a blog post.
- Tie the experience back to the post's specific topic.
- If the user has no detailed background to draw from, keep the personal angle general (e.g. "I've run into this exact issue building X kind of sites") rather than fabricating specifics.
`,
  contrarian: `
=== STYLE: CONTRARIAN / THOUGHT-PROVOKING ===
GOAL: Respectfully offer a different angle or gentle pushback on the post's main point, to spark discussion.

INSTRUCTIONS:
- Stay respectful and professional — this is a differing perspective, NOT an argument or an attack.
- Clearly acknowledge the post's point first, then offer the alternative angle.
- The disagreement must be genuine and specific to the post's content, not contrarian for its own sake.
- Never be dismissive, sarcastic, or condescending.
`,
  humorous: `
=== STYLE: HUMOROUS / WITTY ===
GOAL: A light, clever line relevant to the post — humor that lands naturally, not forced.

INSTRUCTIONS:
- Keep the humor gentle, professional-appropriate, and directly tied to the post's specific content.
- Do NOT use humor on sensitive topics (layoffs, personal hardship, tragedy, serious business risk) — for those, fall back to a genuine, non-joking observation instead.
- One witty line is enough — do not overdo it.
- Never punch down at the post's author or anyone mentioned in it.
`
};

const STYLE_LABELS = {
  professional: 'Professional',
  insightful: 'Insightful',
  short: 'Short',
  friendly: 'Friendly',
  congratulatory: 'Congratulatory',
  question: 'Question',
  storytelling: 'Storytelling',
  contrarian: 'Contrarian',
  humorous: 'Humorous'
};

// Short one-line descriptions used only for the tone-recommendation prompt
// (helps Gemini pick the single best-fitting tone for a given post).
const TONE_DESCRIPTIONS = {
  professional: 'Expresses professional interest and matches skills to the post — best for hiring/client-requirement posts.',
  insightful: 'Adds a genuine expert insight or practical tip to the discussion.',
  short: 'Very concise, 1-3 sentences, direct — good when little needs to be said.',
  friendly: 'Warm, casual, conversational tone — good for lighter/personal posts.',
  congratulatory: 'Celebrates a specific achievement, milestone, launch, or promotion mentioned in the post.',
  question: 'Asks a genuine, specific follow-up question to drive engagement/discussion.',
  storytelling: 'Relates the post to a brief personal/professional experience angle.',
  contrarian: 'Offers a respectful alternative perspective or gentle pushback to spark healthy discussion.',
  humorous: 'A light, witty, relevant remark — only for posts where humor clearly fits, never for sensitive topics.'
};

/**
 * Builds a prompt asking Gemini to look at the post and recommend the SINGLE
 * best-fitting tone from the available options, with a short reason. Used to
 * show a "⭐ Recommended: X" hint in the extension before the user picks a
 * tone from the dropdown.
 */
function buildRecommendTonePrompt({ post, persona, behavior }) {
  const systemInstruction = buildSystemInstruction(persona);
  const behaviorSection = buildBehaviorSection(behavior);

  const toneList = Object.entries(TONE_DESCRIPTIONS)
    .map(([key, desc]) => `- "${key}" (${STYLE_LABELS[key]}): ${desc}`)
    .join('\n');

  const userContent = `
${behaviorSection}

=== TASK: RECOMMEND THE BEST COMMENT TONE FOR THIS POST ===
Look at the post below and pick the SINGLE best-fitting tone from this list
for the user to comment with.

CRITICAL RULE FOR HIRING / FREELANCE OPPORTUNITY POSTS:
- If the post is HIRING or LOOKING FOR A DEVELOPER/FREELANCER (words like "Required", "Hiring", "Looking for", "Project-based", "Budget", "DM portfolio"):
  --> You MUST recommend "professional", "short", or "question" (to ask a smart clarifying project question that grabs client attention).
  --> NEVER recommend "insightful", "friendly", "storytelling", or "humorous" for a hiring post!

Available tones:
${toneList}

${buildPostSection(post)}

4. Which ONE tone best fits this specific post, and why (one short sentence)?

=== REQUIRED JSON OUTPUT ===
{
  "relevant": true,
  "recommendedTone": "one of: ${Object.keys(TONE_DESCRIPTIONS).join(', ')}",
  "reason": "One short sentence explaining why this tone fits this specific post",
  "relevanceScore": 0.95
}

If the post is irrelevant to the user's expertise/interests, set "relevant": false,
still pick the least-bad "recommendedTone" (e.g. "short"), and explain why in "reason".
`;

  return { systemInstruction, userContent };
}

function buildPostSection(post) {
  let profileBlock = '';
  if (post.authorProfile) {
    const p = post.authorProfile;
    const entries = (p.experienceEntries || [])
      .map(e => `  * ${e.title}${e.company ? ` at ${e.company}` : ''}`)
      .join('\n');
    profileBlock = `
=== AUTHOR'S FULL PROFILE CONTEXT ===
- Headline: ${p.headline || 'N/A'}
- Location: ${p.location || 'N/A'}
${p.aboutText ? `- About: ${p.aboutText}\n` : ''}${entries ? `- Key Experience:\n${entries}\n` : ''}
ROLE CLASSIFICATION & ADAPTATION INSTRUCTIONS:
1. Classify the author's role type based on headline & experience:
   - FOUNDER / CEO / BUSINESS OWNER: Focus on business impact, speed, ownership, clean architecture, and project reliability.
   - AGENCY RECRUITER / TALENT ACQUISITION: Focus on clear technical stack, quick availability, portfolio link, and seamless client delivery.
   - CORPORATE HR / HIRING MANAGER: Focus on professional execution, communication, and technical domain match.
2. ABSOLUTE RULE FOR PROFILE DATA:
   - Use the role classification above ONLY to tailor your pitch tone and angle.
   - Do NOT claim or imply any mutual group, shared connection, or common community (e.g. NEVER say "We are both in the same group").
`;
  }

  // Build competitive gap analysis section from existing comments
  let gapBlock = '';
  if (post.existingComments && post.existingComments.length > 0) {
    const commentLines = post.existingComments
      .map((c, i) => `  ${i + 1}. ${c.name}: "${c.text}"`)
      .join('\n');
    gapBlock = `
=== EXISTING COMMENTS ON THIS POST (${post.existingComments.length} seen) ===
${commentLines}

=== COMPETITIVE GAP ANALYSIS — CRITICAL INSTRUCTIONS ===
Before writing the comment, read ALL existing comments above and identify:
1. WHAT ANGLE IS MISSING? — What has NOT been said yet that the post author specifically asked for or hinted at?
2. WHAT IS THE USER'S UNIQUE EDGE? — Compare the user's profile against commenters above. What makes the user stand out?
3. LEAD WITH THE GAP — Open the comment with the unique differentiator that others missed.

EXAMPLE GAPS TO LOOK FOR:
- Post says "Tamil speaker preferred" → most commenters are North Indian → LEAD WITH Tamil/South Indian connection.
- Post emphasizes "speed of delivery" → nobody mentioned timeline → LEAD WITH fast turnaround.
- Post says "WordPress + React" → everyone only mentioned WordPress → LEAD WITH full-stack dual capability.
- Post says "SEO-optimized" → commenters ignored SEO → LEAD WITH SEO + performance expertise.
- Post is from a specific city/region → nobody mentioned location proximity → LEAD WITH local availability.

RULE: Do NOT copy or repeat what others already said. Your comment must occupy a UNIQUE position in this conversation.
`;
  }

  return `
=== TARGET LINKEDIN POST ===
- Author: ${post.authorName || 'Unknown'} (${post.authorHeadline || 'LinkedIn User'})
${profileBlock}${gapBlock}- Post Text:
"""
${post.postText}
"""
${post.hashtags?.length ? `- Hashtags: ${post.hashtags.join(', ')}` : ''}

=== STEP-BY-STEP BEFORE GENERATING ===
1. What is this post about? What is the author looking for or discussing?
2. What SPECIFIC skills/technologies does the post mention?
3. Which of the user's skills MATCH what the post is asking for?
${post.existingComments?.length ? '4. What gap exists in existing comments that the user can uniquely fill?' : ''}
`;
}

function buildCommentPrompt({ post, persona, behavior, style, oneTimeInstruction }) {
  const systemInstruction = buildSystemInstruction(persona);
  const behaviorSection = buildBehaviorSection(behavior);
  const selectedStyleGuide = STYLE_GUIDES[style.toLowerCase()] || STYLE_GUIDES.professional;

  const userContent = `
${behaviorSection}

${selectedStyleGuide}

${oneTimeInstruction ? `=== ONE-TIME USER INSTRUCTION FOR THIS COMMENT ===\n"${oneTimeInstruction}"\n` : ''}

${buildPostSection(post)}

4. Based on the selected style, what should the comment focus on?

=== DM PITCH — HOW TO WRITE IT ===
Write the DM as a natural, flowing message — NOT a numbered list, NOT bullet points, NOT a cover letter.
It should read like something a real developer typed on their phone in 3 minutes.

Structure (in your head only — do NOT make it look structured in the output):

Open with something specific to their post — not a generic opener.
Bad: "Hi Vithya, I came across your post regarding the Freelance Web Developer opportunity."
Good: "Hi Vithya, saw your post — Tamil-speaking preference caught my eye straight away."
Good: "Hi Vithya, your React + WordPress requirement is right in my wheelhouse."

If the post mentions Tamil / South India / a specific region and the user matches — say it naturally and early. Keep it brief (one line).

Mention 1-2 skills that directly match what they asked for. Not a laundry list. Pick the most relevant ones.

Make the workflow line sound natural, not corporate:
Don't: "I leverage modern AI-assisted development tools and workflows to build and iterate fast without compromising code quality."
Do: "I work with modern dev tools that let me build and ship faster than most — without cutting corners on quality."
Do: "My workflow is fast — I use the right tools to iterate quickly and still deliver clean, maintainable code."

For the portfolio intent line — this is MANDATORY in every DM. Make it sound like an honest, confident statement:
Don't: "I am actively expanding my freelance client portfolio with high-quality demo projects ready to show."
Do: "I'm at the stage where I'm building out my client portfolio, so I take every project seriously — you'd get my full focus, honest communication, and competitive pricing."
Do: "I'm looking to take on solid projects right now — that means you get someone who's genuinely motivated, not just going through the motions."
Do: "I'm actively looking for projects to add to my portfolio, which means I'm highly invested in making this work well for you."
NEVER SAY: "fresher", "no experience", "beginner", "new to freelancing", "entry level".

Always end with both real links, formatted cleanly:
Portfolio: ${activePersona.portfolioUrl || 'https://solodeveloper.pro/'}
LinkedIn: ${activePersona.linkedInUrl || 'https://www.linkedin.com/in/suresh-kumar3151/'}

Close with ONE simple sentence — a soft ask. Not three sentences of enthusiasm.
Don't: "I would love to connect and discuss how I can help you achieve your goals and deliver exceptional results!"
Do: "Let me know if you'd like to chat."
Do: "Happy to share more or jump on a quick call."
Do: "Feel free to DM me if you want to discuss scope."

Total DM length: 5-8 sentences max. Tight, readable, real.

=== REQUIRED JSON OUTPUT ===
{
  "relevant": true,
  "intent": "client_requirement" | "general_discussion" | "networking" | "hiring" | "educational" | "personal" | "irrelevant",
  "relevanceScore": 0.95,
  "comment": "The generated comment — must directly address the post's specific requirements",
  "dmPitch": "A tailored, ready-to-send 1:1 DM pitch message to the author following the DM Pitch Guidelines above",
  "reason": "Brief explanation of why this comment was structured this way"
}

If irrelevant, set "relevant": false, "comment": "", "dmPitch": "", and explain in "reason".
`;

  return { systemInstruction, userContent };
}

/**
 * Builds a single prompt that asks Gemini to generate ALL THREE styles
 * (professional, insightful, short) in one JSON response. This lets the
 * user compare all three side-by-side and pick one to insert, instead of
 * generating them one at a time.
 */
function buildAllStylesPrompt({ post, persona, behavior, oneTimeInstruction }) {
  const systemInstruction = buildSystemInstruction(persona);
  const behaviorSection = buildBehaviorSection(behavior);

  const userContent = `
${behaviorSection}

=== TASK: GENERATE ALL THREE COMMENT STYLES ===
Generate THREE separate comments for the SAME post below — one for each style.
Each style must feel distinct (not just the same sentence trimmed), but all three
must equally respect the ABSOLUTE RULES, the behavior memory above, and must
equally match the post's specific requirements. Also generate a tailored DM pitch message.

${STYLE_GUIDES.professional}
${STYLE_GUIDES.insightful}
${STYLE_GUIDES.short}

${oneTimeInstruction ? `=== ONE-TIME USER INSTRUCTION FOR THIS COMMENT (applies to all three) ===\n"${oneTimeInstruction}"\n` : ''}

${buildPostSection(post)}

4. Write three distinct comments, one per style, all matching the post's real requirements, and generate a 1:1 DM pitch message.

=== REQUIRED JSON OUTPUT ===
{
  "relevant": true,
  "intent": "client_requirement" | "general_discussion" | "networking" | "hiring" | "educational" | "personal" | "irrelevant",
  "relevanceScore": 0.95,
  "comments": {
    "professional": "...",
    "insightful": "...",
    "short": "..."
  },
  "dmPitch": "A tailored, ready-to-send 1:1 DM pitch message to the author (e.g. 'Hi Abhay, Thanks for connecting... I saw your post regarding... Here is my portfolio...'), or empty string if not a hiring/lead post",
  "reason": "Brief explanation of why these comments were structured this way"
}

If irrelevant, set "relevant": false, "comments": { "professional": "", "insightful": "", "short": "" }, "dmPitch": "", and explain in "reason".
`;

  return { systemInstruction, userContent };
}

module.exports = { buildCommentPrompt, buildAllStylesPrompt, buildRecommendTonePrompt, buildSystemInstruction, buildBehaviorSection, STYLE_LABELS, TONE_DESCRIPTIONS };
