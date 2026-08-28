/**
 * Express router for LinkedIn Comment Generation
 */

const express = require('express');
const router = express.Router();
const { generateComment } = require('../services/gemini');
const { getBehaviorMemory } = require('../services/behavior');
const { validateGenerateCommentRequest } = require('../utils/validation');

router.post('/generate-comment', async (req, res) => {
  try {
    const validation = validateGenerateCommentRequest(req);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.message });
    }

    const { post, persona, behavior, style, oneTimeInstruction } = req.body;

    // Merge backend behavior memory with request behavior memory if provided
    const activeBehavior = {
      ...getBehaviorMemory(),
      ...(behavior || {})
    };

    console.log(`[AI Assistant API] Generating comment style="${style}" for post by "${post.authorName || 'Unknown'}"`);

    const result = await generateComment({
      post,
      persona: persona || {},
      behavior: activeBehavior,
      style,
      oneTimeInstruction: oneTimeInstruction || null
    });

    if (result.relevant === false || result.intent === 'irrelevant') {
      return res.json({
        success: true,
        skip: true,
        reason: result.reason || 'This post does not appear relevant to your web development profile.',
        intent: 'irrelevant'
      });
    }

    return res.json({
      success: true,
      comment: result.comment,
      relevance: typeof result.relevanceScore === 'number' ? result.relevanceScore : 0.9,
      intent: result.intent || 'general_discussion',
      reason: result.reason || 'Comment generated successfully.'
    });

  } catch (err) {
    console.error('[AI Assistant API Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while generating comment.'
    });
  }
});

module.exports = router;
