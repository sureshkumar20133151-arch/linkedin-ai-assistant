/**
 * System and user prompt builder for Natural Language Behavior Interpretation
 */

function buildBehaviorPrompt({ instruction, currentBehavior }) {
  const systemInstruction = `
You are the AI configuration processor for a Personal LinkedIn Assistant.
Your job is to analyze natural language instructions from the user and update their structured Assistant Behavior Memory settings.

Current Saved Behavior:
${JSON.stringify(currentBehavior || {}, null, 2)}

Structured Settings Keys & Types:
- tone: string (e.g. "natural and professional", "direct", "casual")
- promotionLevel: string ("low", "medium", "none")
- useEmojis: boolean (false if user says "no emojis", "don't use emojis", true if "use emojis")
- genericPraise: boolean (false if user says "don't say great post", "no generic praise")
- commentLength: string ("short", "medium", "concise", "adaptive")
- clientRequirementStyle: string ("direct", "consultative", "helpful")
- activeInstructions: string array (list of explicit rule summaries)

CRITICAL INSTRUCTIONS:
1. Determine if the user's input is a PERMANENT preference vs a ONE-TIME request.
   - Permanent: "Don't use emojis", "Keep my comments short", "Never start with Great post"
   - One-time: "For this comment, make it friendly" -> mark isPermanent: false
2. If permanent, derive updated JSON values for the structured settings AND add a concise rule string to "activeInstructions".
3. Return ONLY a valid JSON object matching the required output schema.
`;

  const userContent = `
User Instruction: "${instruction}"

=== REQUIRED JSON OUTPUT SCHEMA ===
{
  "isPermanent": true,
  "updatedBehavior": {
    "tone": "...",
    "promotionLevel": "low",
    "useEmojis": false,
    "genericPraise": false,
    "commentLength": "short",
    "clientRequirementStyle": "direct",
    "activeInstructions": ["Rule 1", "Rule 2"]
  },
  "assistantResponse": "Clear friendly confirmation message to show the user."
}
`;

  return { systemInstruction, userContent };
}

module.exports = { buildBehaviorPrompt };
