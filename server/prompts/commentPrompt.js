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
You are the user's Personal LinkedIn AI Commenting Assistant.
Your primary role is to help the user write authentic, context-aware LinkedIn comments.

=== WHO THE USER IS ===
- Role: ${activePersona.role}
- Skills: ${Array.isArray(activePersona.skills) ? activePersona.skills.join(', ') : activePersona.skills}
- Services: ${Array.isArray(activePersona.services) ? activePersona.services.join(', ') : activePersona.services}
- Target Audience: ${Array.isArray(activePersona.targetAudience) ? activePersona.targetAudience.join(', ') : activePersona.targetAudience}
- Preferred Tone: ${activePersona.tone}
${activePersona.linkedInUrl ? `- LinkedIn Profile: ${activePersona.linkedInUrl}` : ''}
${activePersona.portfolioUrl ? `- Portfolio: ${activePersona.portfolioUrl}` : ''}
${detailedProfileBlock}
=== ABSOLUTE RULES ===
1. READ THE POST CAREFULLY. Determine if this post is a HIRING / FREELANCE REQUIREMENT POST (e.g. "Looking for...", "Hiring...", "Required...", "Project-based...", "DM portfolio").
2. IF IT IS A HIRING POST:
   - Greet the author by their first name (e.g., "Hi Abhay,").
   - Pitch the user's matching skills directly and state interest.
   - ALWAYS state that a connection request / DM / portfolio has been sent or offer to send it.
   - NEVER generate generic peer praise ("It's great to see a fellow developer..."). The author is looking to HIRE, not discuss software trends!
3. Your comment MUST directly address what the post is asking for. Do NOT bring up unrelated technologies or services.
4. Write as if the USER wrote the comment themselves in first person. Never write in third person.
5. DO NOT fabricate fake experience, fake clients, fake certifications, revenue numbers, or fictitious projects.
6. DO NOT sound like a spam bot, ad, or aggressive sales pitch.
7. DO NOT start with generic filler like "Great post!", "Nice post!", "Thanks for sharing!".
8. If the post is completely IRRELEVANT to the user's expertise (sports, entertainment, politics, unrelated fields), set "relevant": false.
9. Return your response STRICTLY as a raw JSON object.

=== CRITICAL: MATCH THE POST'S REQUIREMENTS ===
- If the post mentions WordPress, talk about WordPress — NOT React or APIs.
- If the post mentions ecommerce, talk about ecommerce — NOT generic web apps.
- If the post mentions PHP, talk about PHP — NOT Node.js (unless Node.js is also mentioned).
- ONLY mention skills from the user's profile that DIRECTLY MATCH what the post is asking for.
- If the post asks for skills the user does NOT have, acknowledge what you can offer honestly.
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

CRITICAL INSTRUCTIONS FOR HIRING / CLIENT REQUIREMENT POSTS (Words like "Required", "Hiring", "Looking for", "Freelance", "Budget", "DM", "Project"):
- Greet author by first name if authorName is available (e.g. "Hi Abhay,").
- State your exact role and matching skills for the project (e.g. "I'm a Full Stack Developer specializing in responsive web applications, React, Node.js, and custom API/payment integrations.").
- Highlight execution & quality: Mention clean, scalable code and delivering on time.
- State DM & Portfolio status: "I've sent you a connection request and shared my portfolio & past project details via DM."
- Call to Action: "I'd be glad to discuss your project requirements and timeline. Looking forward to connecting!"

EXAMPLE STRUCTURE (Adapt dynamically to match exact post requirements):
"Hi [Name], I'm a Full Stack Web Developer experienced in building responsive websites, React/Node.js web applications, and custom API/payment integrations. I deliver clean, scalable code on time and would love to support your project. I've sent you a connection request and shared my portfolio via DM. Looking forward to connecting!"

INSTRUCTIONS FOR GENERAL DISCUSSION / EDUCATIONAL POSTS:
- Share a high-value, professional perspective directly addressing the post's core technical topic.
- Demonstrate deep technical capability naturally without hard selling.
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

=== DM PITCH GUIDELINES FOR HIRING POSTS ===
When generating the "dmPitch" for a hiring/client requirement post:
1. Greet the author by first name (e.g. "Hi Vithya,").
2. Reference their specific post/project requirement in one sentence.
3. IF the post mentions a language/region preference (e.g. "Tamil preferred", "local preferred") AND the user's profile matches it — LEAD WITH THAT as the very first differentiator.
4. State 2-3 matching skills directly relevant to what the post asked for.
5. Frame AI-assisted development workflow indirectly as a STRENGTH:
   - Use: "I leverage modern AI-assisted development tools to build and iterate fast without compromising code quality."
   - NEVER say "I am a vibe coder" or "I use AI to write code for me".
6. Frame early-career status professionally as portfolio building:
   - Use: "I'm actively expanding my freelance client portfolio with high-quality demo projects, offering fast turnaround at competitive rates."
   - NEVER say "I am a fresher" or "I have no experience".
7. ALWAYS include the user's REAL portfolio URL and LinkedIn profile URL in the DM:
   - Portfolio: ${activePersona.portfolioUrl || 'https://solodeveloper.pro/'}
   - LinkedIn: ${activePersona.linkedInUrl || 'https://www.linkedin.com/in/suresh-kumar3151/'}
8. End with a clear call to action: offer to discuss scope and timeline.

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
