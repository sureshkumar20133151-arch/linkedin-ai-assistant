/**
 * Prompt builder for LinkedIn Direct Messages (DM inbox).
 *
 * Handles two modes, auto-detected by the caller (see routes/message.js)
 * based on whether the conversation already has incoming messages:
 *
 *  - "outreach": the user is starting a brand-new conversation with someone
 *    (cold outreach). No prior messages exist.
 *  - "reply": the recipient has already messaged the user, and the user
 *    wants a reply drafted based on the conversation so far.
 *
 * Reuses buildSystemInstruction/buildBehaviorSection from commentPrompt.js
 * so persona, detailedProfile, and assistant behavior memory are handled
 * identically to public comment generation.
 */

const { buildSystemInstruction, buildBehaviorSection } = require('./commentPrompt');

const MESSAGE_STYLE_GUIDES = {
  professional: `
=== STYLE: PROFESSIONAL ===
GOAL: A confident, respectful, professional message.
- Get to the point without being cold or robotic.
- If this is an outreach opener, briefly explain why you're reaching out, tied to something specific about the recipient.
- If this is a reply, directly address what they last said before adding anything new.
- Only mention the user's services/skills when it's genuinely relevant to the conversation.
`,
  insightful: `
=== STYLE: INSIGHTFUL ===
GOAL: Lead with genuine value before any ask.
- Share a specific, useful observation relevant to the recipient's role/industry or to what they just said.
- Avoid generic compliments ("Great profile!", "Impressive background!").
- The value/insight should feel like a real reason to reply, not a lead-in to a pitch.
`,
  short: `
=== STYLE: SHORT ===
GOAL: 1–3 sentences maximum.
- Extremely concise, no filler, no long intros.
- Still purposeful — say the one thing that matters most right now.
`
};

function buildRecipientSection(recipient) {
  return `
=== RECIPIENT ===
- Name: ${recipient?.name || 'Unknown'}
- Headline: ${recipient?.headline || 'Not available'}
`;
}

function buildConversationSection(conversation) {
  if (!conversation?.messages?.length) return '';
  const lines = conversation.messages
    .map(m => `${m.sender === 'me' ? 'You (the user)' : (conversation.recipientName || recipientFallback(conversation))}: ${m.text}`)
    .join('\n');
  return `
=== RECENT CONVERSATION HISTORY (oldest to newest) ===
${lines}

The LAST message above is what you must reply to.
`;
}

function recipientFallback() {
  return 'Them';
}

function buildModeSection(mode) {
  return mode === 'reply'
    ? `
=== TASK: REPLY TO AN INCOMING MESSAGE ===
The recipient has already messaged the user (see conversation history below).
Write a natural, contextual REPLY to their MOST RECENT message.
Do NOT restart the conversation or reintroduce yourself — there is already history.
`
    : `
=== TASK: COLD OUTREACH — FIRST MESSAGE ===
This is the FIRST message the user is sending to this person. There is no prior conversation.
- Do NOT sound like a mass/templated message.
- Reference something specific and genuine about the recipient's role/headline ONLY if it naturally fits — never fabricate details not given.
- Keep it short, low-pressure, and inviting a reply.
- Do NOT pitch services aggressively in the opener, and do NOT ask for a meeting/call in the very first message unless the assistant behavior explicitly says to be direct.
`;
}

function buildMessagePrompt({ mode, recipient, conversation, persona, behavior, style, oneTimeInstruction }) {
  const systemInstruction = buildSystemInstruction(persona) + `
=== CONTEXT: THIS IS A PRIVATE LINKEDIN DIRECT MESSAGE, NOT A PUBLIC COMMENT ===
You are drafting a private 1:1 LinkedIn message the user will send to ${recipient?.name || 'this person'}.
`;

  const behaviorSection = buildBehaviorSection(behavior);
  const selectedStyleGuide = MESSAGE_STYLE_GUIDES[(style || 'professional').toLowerCase()] || MESSAGE_STYLE_GUIDES.professional;

  const userContent = `
${behaviorSection}

${buildModeSection(mode)}

${selectedStyleGuide}

${oneTimeInstruction ? `=== ONE-TIME USER INSTRUCTION FOR THIS MESSAGE ===\n"${oneTimeInstruction}"\n` : ''}

${buildRecipientSection(recipient)}
${buildConversationSection(conversation)}

=== REQUIRED JSON OUTPUT ===
{
  "relevant": true,
  "message": "The generated LinkedIn message text",
  "reason": "Brief explanation of why this message was structured this way"
}

If there is not enough context to write a meaningful message (e.g. no recipient name/headline and no conversation history), set "relevant": false, "message": "", and explain in "reason".
`;

  return { systemInstruction, userContent };
}

/**
 * Builds a single prompt that asks Gemini for all three styles at once,
 * mirroring buildAllStylesPrompt() in commentPrompt.js.
 */
function buildAllStylesMessagePrompt({ mode, recipient, conversation, persona, behavior, oneTimeInstruction }) {
  const systemInstruction = buildSystemInstruction(persona) + `
=== CONTEXT: THIS IS A PRIVATE LINKEDIN DIRECT MESSAGE, NOT A PUBLIC COMMENT ===
You are drafting a private 1:1 LinkedIn message the user will send to ${recipient?.name || 'this person'}.
`;

  const behaviorSection = buildBehaviorSection(behavior);

  const userContent = `
${behaviorSection}

${buildModeSection(mode)}

=== TASK: GENERATE ALL THREE MESSAGE STYLES ===
Generate THREE separate messages for the SAME recipient/context below — one per style.
Each must feel distinct but equally respect the rules, behavior memory, and mode above.

${MESSAGE_STYLE_GUIDES.professional}
${MESSAGE_STYLE_GUIDES.insightful}
${MESSAGE_STYLE_GUIDES.short}

${oneTimeInstruction ? `=== ONE-TIME USER INSTRUCTION (applies to all three) ===\n"${oneTimeInstruction}"\n` : ''}

${buildRecipientSection(recipient)}
${buildConversationSection(conversation)}

=== REQUIRED JSON OUTPUT ===
{
  "relevant": true,
  "messages": {
    "professional": "...",
    "insightful": "...",
    "short": "..."
  },
  "reason": "Brief explanation"
}

If there is not enough context to write meaningful messages, set "relevant": false, "messages": { "professional": "", "insightful": "", "short": "" }, and explain in "reason".
`;

  return { systemInstruction, userContent };
}

module.exports = { buildMessagePrompt, buildAllStylesMessagePrompt };
