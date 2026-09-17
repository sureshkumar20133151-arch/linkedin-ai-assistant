/**
 * Gemini API Service Provider
 */

const { buildCommentPrompt, buildAllStylesPrompt, buildRecommendTonePrompt } = require('../prompts/commentPrompt');
const { buildMessagePrompt, buildAllStylesMessagePrompt } = require('../prompts/messagePrompt');
const { buildBehaviorPrompt } = require('../prompts/behaviorPrompt');
const { buildICPPrompt } = require('../prompts/icpPrompt');

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
    headers: { 'Content-Type': 'application/json' },
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

/**
 * Variant for ICP Research — returns plain markdown text, not JSON.
 * The ICP report is too long and complex for JSON parsing.
 */
async function callGeminiAPIText(systemInstruction, userContent) {
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
      temperature: 0.5,
      maxOutputTokens: 8192
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates && data.candidates[0];

  if (!candidate || !candidate.content || !Array.isArray(candidate.content.parts) || !candidate.content.parts[0]) {
    const reason = (candidate && candidate.finishReason) || 'UNKNOWN';
    throw new Error(`Gemini returned no usable content (finishReason: ${reason}).`);
  }

  const responseText = candidate.content.parts[0].text;
  if (typeof responseText !== 'string' || !responseText.trim()) {
    throw new Error('Gemini returned an empty response.');
  }

  return responseText.trim();
}

async function generateComment(params) {
  const { systemInstruction, userContent } = buildCommentPrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

async function generateAllComments(params) {
  const { systemInstruction, userContent } = buildAllStylesPrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

async function generateToneRecommendation(params) {
  const { systemInstruction, userContent } = buildRecommendTonePrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

async function interpretBehaviorInstruction(instruction, currentBehavior) {
  const { systemInstruction, userContent } = buildBehaviorPrompt({ instruction, currentBehavior });
  return await callGeminiAPI(systemInstruction, userContent);
}

async function generateMessage(params) {
  const { systemInstruction, userContent } = buildMessagePrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

async function generateAllMessages(params) {
  const { systemInstruction, userContent } = buildAllStylesMessagePrompt(params);
  return await callGeminiAPI(systemInstruction, userContent);
}

/**
 * ICP Research — generates a full International Ideal Client Persona report
 * as markdown text (not JSON — too long for JSON parsing).
 */
async function generateICPReport(params) {
  const { systemInstruction, userContent } = buildICPPrompt(params);
  return await callGeminiAPIText(systemInstruction, userContent);
}

module.exports = {
  generateComment,
  generateAllComments,
  generateToneRecommendation,
  interpretBehaviorInstruction,
  generateMessage,
  generateAllMessages,
  generateICPReport
};
