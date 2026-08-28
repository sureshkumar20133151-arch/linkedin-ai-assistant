/**
 * System and user prompt builder for LinkedIn AI Comment Generation
 */

function buildCommentPrompt({ post, persona, behavior, style, oneTimeInstruction }) {
  const defaultPersona = {
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
    tone: "Professional, Natural, Helpful, Confident, Not overly promotional"
  };

  const activePersona = { ...defaultPersona, ...persona };

  const systemInstruction = `
You are the user's Personal LinkedIn AI Assistant.
Your primary role is to help the user write authentic, high-quality, relevant LinkedIn comments.

=== USER IDENTITY & PERSONA ===
- Role: ${activePersona.role}
- Skills: ${Array.isArray(activePersona.skills) ? activePersona.skills.join(', ') : activePersona.skills}
- Services: ${Array.isArray(activePersona.services) ? activePersona.services.join(', ') : activePersona.services}
- Target Audience: ${Array.isArray(activePersona.targetAudience) ? activePersona.targetAudience.join(', ') : activePersona.targetAudience}
- Preferred Tone: ${activePersona.tone}

=== CRITICAL RULES & CONSTRAINTS ===
1. DO NOT fabricate false experience, fake clients, fake certifications, revenue numbers, or fictitious past projects.
2. Write as if the USER wrote the comment directly. Never speak in third person ("The user is a developer...").
3. DO NOT sound like a spam bot, advertisement, or aggressive sales pitch.
4. Avoid generic filler praise such as "Great post!", "Nice post!", "Thanks for sharing!" at the start of comments.
5. If the post is completely IRRELEVANT (e.g. sports, entertainment, celebrity gossip, unrelated personal rants), set "relevant": false, "intent": "irrelevant", "comment": "", and explain why in "reason".
6. Never force website development services into posts where it does not naturally belong.
7. Return your response STRICTLY as a raw JSON object matching the required schema.
`;

  const behaviorSection = `
=== ASSISTANT BEHAVIOR MEMORY ===
- Overall Tone: ${behavior?.tone || 'natural and professional'}
- Promotion Level: ${behavior?.promotionLevel || 'low'}
- Use Emojis: ${behavior?.useEmojis ? 'Allowed (sparingly)' : 'STRICTLY NO EMOJIS'}
- Avoid Generic Praise: ${behavior?.genericPraise === false ? 'No' : 'Yes (Do not start with "Great post!")'}
- Preferred Comment Length: ${behavior?.commentLength || 'adaptive'}
- Client Requirement Response Style: ${behavior?.clientRequirementStyle || 'direct, value-focused, non-salesy'}
${behavior?.activeInstructions?.length ? `- Active Custom Rules:\n  * ${behavior.activeInstructions.join('\n  * ')}` : ''}
`;

  const styleGuides = {
    professional: `
- Selected Style: PROFESSIONAL
- Goal: Respond with high professional standard. If it is a client requirement/project search, demonstrate problem-solving knowledge naturally, mention relevant capability without sounding pushy, and invite conversation.
`,
    insightful: `
- Selected Style: INSIGHTFUL
- Goal: Add genuine value to the discussion. Highlight a practical consideration, technical nuance, or business goal (e.g., performance, conversion, mobile UX) related to the post without aggressively advertising services.
`,
    short: `
- Selected Style: SHORT
- Goal: Concise, 1 to 3 sentences maximum. Clear, natural, and directly to the point.
`
  };

  const selectedStyleGuide = styleGuides[style.toLowerCase()] || styleGuides.professional;

  const userContent = `
${behaviorSection}

${selectedStyleGuide}

${oneTimeInstruction ? `=== ONE-TIME USER INSTRUCTION FOR THIS COMMENT ===\n"${oneTimeInstruction}"\n` : ''}

=== TARGET LINKEDIN POST CONTEXT ===
- Author: ${post.authorName || 'Unknown'} (${post.authorHeadline || 'LinkedIn User'})
- Post Text:
"""
${post.postText}
"""
${post.hashtags?.length ? `- Hashtags: ${post.hashtags.join(', ')}` : ''}

=== REQUIRED JSON OUTPUT SCHEMA ===
Return ONLY a valid JSON object formatted as follows:
{
  "relevant": true,
  "intent": "client_requirement" | "general_discussion" | "networking" | "hiring" | "educational" | "personal" | "irrelevant",
  "relevanceScore": 0.95,
  "comment": "The generated comment text to insert into LinkedIn editor",
  "reason": "Brief internal explanation of why this comment was structured this way or why it was skipped"
}

If irrelevant, set "relevant": false, "comment": "", and explain in "reason".
`;

  return { systemInstruction, userContent };
}

module.exports = { buildCommentPrompt };
