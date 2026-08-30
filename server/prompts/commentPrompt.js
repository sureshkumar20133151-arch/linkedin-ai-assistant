/**
 * System and user prompt builder for LinkedIn AI Comment Generation
 */

const DEFAULT_PERSONA = {
  role: "Website Developer",
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
  detailedProfile: ""
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
GOAL: The user wants to respond as a PROFESSIONAL FREELANCER/DEVELOPER pitching for work.

CRITICAL INSTRUCTION FOR HIRING / CLIENT REQUIREMENT POSTS (Words like "Required", "Hiring", "Looking for", "Freelance", "Budget", "DM", "Project"):
- The author is HIRING or LOOKING FOR A DEVELOPER. Do NOT give peer advice, educational commentary, or generic praise (NEVER say "It's great to see a fellow developer...").
- Greet the author by their first name if authorName is available (e.g., "Hi Abhay,").
- Directly state the user's role and matching skills for the project requirements.
- Mention that a connection request and/or portfolio has been sent via DM (e.g., "I've sent you a connection request and shared my portfolio via DM.").
- Express availability and desire to discuss the project.

EXAMPLE FOR HIRING POST:
"Hi [Name], I'm a Full Stack Web Developer experienced in responsive websites, React/Node.js, and API integrations. I'd love to discuss your project requirements — I've sent you a connection request and shared my portfolio via DM. Thanks!"

INSTRUCTIONS FOR GENERAL DISCUSSION / EDUCATIONAL POSTS:
- Add a useful professional perspective related to the post topic.
- Demonstrate relevant expertise naturally without forcing services.
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
`
};

function buildPostSection(post) {
  return `
=== TARGET LINKEDIN POST ===
- Author: ${post.authorName || 'Unknown'} (${post.authorHeadline || 'LinkedIn User'})
- Post Text:
"""
${post.postText}
"""
${post.hashtags?.length ? `- Hashtags: ${post.hashtags.join(', ')}` : ''}

=== STEP-BY-STEP BEFORE GENERATING ===
1. What is this post about? What is the author looking for or discussing?
2. What SPECIFIC skills/technologies does the post mention?
3. Which of the user's skills MATCH what the post is asking for?
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

=== REQUIRED JSON OUTPUT ===
{
  "relevant": true,
  "intent": "client_requirement" | "general_discussion" | "networking" | "hiring" | "educational" | "personal" | "irrelevant",
  "relevanceScore": 0.95,
  "comment": "The generated comment — must directly address the post's specific requirements",
  "reason": "Brief explanation of why this comment was structured this way"
}

If irrelevant, set "relevant": false, "comment": "", and explain in "reason".
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
equally match the post's specific requirements.

${STYLE_GUIDES.professional}
${STYLE_GUIDES.insightful}
${STYLE_GUIDES.short}

${oneTimeInstruction ? `=== ONE-TIME USER INSTRUCTION FOR THIS COMMENT (applies to all three) ===\n"${oneTimeInstruction}"\n` : ''}

${buildPostSection(post)}

4. Write three distinct comments, one per style, all matching the post's real requirements.

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
  "reason": "Brief explanation of why these comments were structured this way"
}

If irrelevant, set "relevant": false, "comments": { "professional": "", "insightful": "", "short": "" }, and explain in "reason".
`;

  return { systemInstruction, userContent };
}

module.exports = { buildCommentPrompt, buildAllStylesPrompt, buildSystemInstruction, buildBehaviorSection };
