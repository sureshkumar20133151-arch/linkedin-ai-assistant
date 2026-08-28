/**
 * Routes for LinkedIn Direct Message (DM inbox) generation.
 * Covers both cold outreach (first message to someone) and replying to an
 * incoming message — mode is auto-detected from whether conversation
 * history was supplied by the extension.
 */

const express = require('express');
const router = express.Router();

const { generateMessage, generateAllMessages } = require('../services/gemini');
const { getBehaviorMemory } = require('../services/behavior');
const { validateGenerateMessageRequest } = require('../utils/validation');

function detectMode(conversation) {
  return (conversation && Array.isArray(conversation.messages) && conversation.messages.length > 0)
    ? 'reply'
    : 'outreach';
}

// Single style: professional | insightful | short
router.post('/generate-message', async (req, res) => {
  try {
    const validation = validateGenerateMessageRequest(req);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.message });
    }

    const { recipient, conversation, persona, behavior, style, oneTimeInstruction } = req.body;
    const mode = detectMode(conversation);
    const activeBehavior = { ...getBehaviorMemory(), ...(behavior || {}) };

    console.log(`[AI Assistant API] Generating ${mode} message (style: ${style || 'professional'}) for "${recipient?.name || 'unknown recipient'}"`);

    const result = await generateMessage({
      mode,
      recipient: recipient || {},
      conversation: conversation || { messages: [] },
      persona: persona || {},
      behavior: activeBehavior,
      style: style || 'professional',
      oneTimeInstruction: oneTimeInstruction || null
    });

    if (result.relevant === false) {
      return res.json({
        success: true,
        skip: true,
        reason: result.reason || 'Not enough context to draft a meaningful message.'
      });
    }

    return res.json({
      success: true,
      message: result.message,
      mode,
      reason: result.reason || 'Message generated successfully.'
    });

  } catch (err) {
    console.error('[AI Assistant API Error - generate-message]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while generating message.'
    });
  }
});

// All three styles in one call
router.post('/generate-message-all', async (req, res) => {
  try {
    const validation = validateGenerateMessageRequest(req);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.message });
    }

    const { recipient, conversation, persona, behavior, oneTimeInstruction } = req.body;
    const mode = detectMode(conversation);
    const activeBehavior = { ...getBehaviorMemory(), ...(behavior || {}) };

    console.log(`[AI Assistant API] Generating ALL ${mode} message styles for "${recipient?.name || 'unknown recipient'}"`);

    const result = await generateAllMessages({
      mode,
      recipient: recipient || {},
      conversation: conversation || { messages: [] },
      persona: persona || {},
      behavior: activeBehavior,
      oneTimeInstruction: oneTimeInstruction || null
    });

    if (result.relevant === false) {
      return res.json({
        success: true,
        skip: true,
        reason: result.reason || 'Not enough context to draft meaningful messages.'
      });
    }

    return res.json({
      success: true,
      messages: result.messages || {},
      mode,
      reason: result.reason || 'Messages generated successfully.'
    });

  } catch (err) {
    console.error('[AI Assistant API Error - generate-message-all]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while generating messages.'
    });
  }
});

module.exports = router;
