/**
 * Gemini API Service Provider
 */

const { buildCommentPrompt, buildAllStylesPrompt, buildRecommendTonePrompt } = require('../prompts/commentPrompt');
const { buildMessagePrompt, buildAllStylesMessagePrompt } = require('../prompts/messagePrompt');
const { buildBehaviorPrompt } = require('../prompts/behaviorPrompt');

async function callGeminiAPI(systemInstruction, userContent) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in server/.env file.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userContent }]
      }
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.4
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const candidate = data.candidates && data.candidates[0];

  if (!candidate) {
    throw new Error('Invalid or empty response structure from Gemini API (no candidates returned).');
  }

  // finishReason can be SAFETY, RECITATION, MAX_TOKENS, etc. — in these
  // cases candidate.content.parts is often missing entirely, so check this
  // BEFORE trying to read parts[0].text (which would otherwise throw a raw
  // TypeError instead of a clear, actionable error message).
  if (!candidate.content || !Array.isArray(candidate.content.parts) || !candidate.content.parts[0]) {
    const reason = candidate.finishReason || 'UNKNOWN';
    throw new Error(`Gemini returned no usable content (finishReason: ${reason}). The post or persona content may have been blocked by safety filters, or the response was cut off.`);
  }

  const responseText = candidate.content.parts[0].text;

  if (typeof responseText !== 'string' || !responseText.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  // Clean markdown code fence formatting if present
  const cleanedText = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

  try {
    return JSON.parse(cleanedText);
  } catch (err) {
    throw new Error(`Failed to parse JSON response from Gemini API: ${cleanedText}`);
  }
}

async function generateComment(params) {
  const { systemInstruction, userContent } = buildCommentPrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

/**
 * Generates all three styles (professional, insightful, short) in a single
 * Gemini call, so the extension can show all three for the user to compare
 * and pick one — instead of three separate round trips.
 */
async function generateAllComments(params) {
  const { systemInstruction, userContent } = buildAllStylesPrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

/**
 * Asks Gemini to recommend the single best-fitting comment tone for a post,
 * so the extension can show a "⭐ Recommended: X" hint before the user picks.
 */
async function generateToneRecommendation(params) {
  const { systemInstruction, userContent } = buildRecommendTonePrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

async function interpretBehaviorInstruction(instruction, currentBehavior) {
  const { systemInstruction, userContent } = buildBehaviorPrompt({ instruction, currentBehavior });
  return await callGeminiAPI(systemInstruction, userContent);
}

/**
 * LinkedIn DM (Messaging) generation — cold outreach or reply, single style.
 */
async function generateMessage(params) {
  const { systemInstruction, userContent } = buildMessagePrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

/**
 * LinkedIn DM (Messaging) generation — all three styles in one call.
 */
async function generateAllMessages(params) {
  const { systemInstruction, userContent } = buildAllStylesMessagePrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

module.exports = {
  generateComment,
  generateAllComments,
  generateToneRecommendation,
  interpretBehaviorInstruction,
  generateMessage,
  generateAllMessages
};
