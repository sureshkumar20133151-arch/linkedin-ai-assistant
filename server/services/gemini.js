/**
 * Gemini API Service Provider
 */

const { buildCommentPrompt } = require('../prompts/commentPrompt');
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

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid or empty response structure from Gemini API.');
  }

  const responseText = data.candidates[0].content.parts[0].text;
  
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

async function interpretBehaviorInstruction(instruction, currentBehavior) {
  const { systemInstruction, userContent } = buildBehaviorPrompt({ instruction, currentBehavior });
  return await callGeminiAPI(systemInstruction, userContent);
}

module.exports = {
  generateComment,
  interpretBehaviorInstruction
};
