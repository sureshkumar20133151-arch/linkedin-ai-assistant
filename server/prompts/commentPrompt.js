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
1. READ THE POST CAREFULLY. Identify the EXACT skills, technologies, and requirements mentioned in the post.
2. Your comment MUST directly address what the post is asking for. Do NOT bring up unrelated technologies or services.
3. Write as if the USER wrote the comment themselves in first person. Never write in third person.
4. DO NOT fabricate fake experience, fake clients, fake certifications, revenue numbers, or fictitious projects.
5. DO NOT sound like a spam bot, ad, or aggressive sales pitch.
6. DO NOT start with generic filler like "Great post!", "Nice post!", "Thanks for sharing!".
7. If the post is completely IRRELEVANT to the user's expertise (sports, entertainment, politics, unrelated fields), set "relevant": false.
8. Return your response STRICTLY as a raw JSON object.

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
GOAL: The user wants to respond as a PROFESSIONAL who is interested in this opportunity.

INSTRUCTIONS FOR CLIENT REQUIREMENT / HIRING POSTS:
- The user is a freelance developer looking for work.
- Identify the EXACT skills and technologies the post is asking for.
- Match ONLY the user's skills that are relevant to what the post needs.
- Express genuine interest and availability for the project/role.
- Briefly highlight how the user's matching skills are relevant to the specific project described.
- If the post says "DM us" or "send portfolio", acknowledge that naturally (e.g., "I'll DM you my portfolio and availability").
- Sound like someone who is ready and capable, NOT like a generic motivational speaker.
- Keep it direct and professional — the user is essentially expressing interest in the work.

EXAMPLE APPROACH (do NOT copy, generate dynamically):
If post says "Looking for WordPress developer with PHP and CSS skills":
Good: "I work with WordPress, PHP, and CSS regularly and can handle customization and theme development. Happy to share my portfolio — I'll DM you."
Bad: "Custom web applications and robust API integrations are incredibly valuable..." (WRONG — irrelevant to what they asked)

INSTRUCTIONS FOR GENERAL DISCUSSION / EDUCATIONAL POSTS:
- Add a useful professional perspective related to the post topic.
- Demonstrate relevant expertise naturally without forcing services.
`,
  insightful: `
=== STYLE: INSIGHTFUL ===
GOAL: Add genuine value to the discussion with a practical, expert observation.

INSTRUCTIONS:
- Read the post carefully and identify the core topic or question.
- Share a useful insight, practical tip, or important consideration specifically related to that topic.
- Demonstrate expertise naturally through knowledge, not by listing services.
- Do NOT repeat what the post already says.
- Do NOT turn it into a sales pitch.
- For hiring/requirement posts: offer a genuinely helpful technical perspective related to what they're building.
`,
  short: `
=== STYLE: SHORT ===
GOAL: Concise, 1 to 3 sentences maximum. Direct and to the point.

INSTRUCTIONS:
- Keep it extremely concise (1-3 sentences).
- Address the specific topic of the post directly.
- For hiring posts: express interest and availability briefly.
- For discussion posts: make one sharp, relevant observation.
- No filler words, no long explanations.
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
