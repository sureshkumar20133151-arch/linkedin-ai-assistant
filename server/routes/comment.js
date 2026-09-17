/**
 * Express router for LinkedIn Comment Generation
 */

const express = require('express');
const router = express.Router();
const { generateComment, generateOutreach, generateAllComments, generateToneRecommendation } = require('../services/gemini');
const { getBehaviorMemory } = require('../services/behavior');
const { validateGenerateCommentRequest, validateGenerateAllCommentsRequest, validateRecommendToneRequest } = require('../utils/validation');

// Single style comment generation
router.post('/generate-comment', async (req, res) => {
  try {
    const validation = validateGenerateCommentRequest(req);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.message });
    }

    const { post, persona, behavior, style, oneTimeInstruction } = req.body;

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
      dmPitch: result.dmPitch || '',
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

// Outreach Skill: For hiring / requirement posts — returns:
//   Opportunity Analysis + Value-First Public Comment + 4 DM styles + 2 Follow-ups
router.post('/generate-outreach', async (req, res) => {
  try {
    const { post, persona, behavior, oneTimeInstruction } = req.body;

    if (!post || !post.postText || !post.postText.trim()) {
      return res.status(400).json({ success: false, error: 'Post content is required.' });
    }

    const activeBehavior = {
      ...getBehaviorMemory(),
      ...(behavior || {})
    };

    console.log(`[AI Assistant API] Running Outreach Skill for post by "${post.authorName || 'Unknown'}"`);

    const result = await generateOutreach({
      post,
      persona: persona || {},
      behavior: activeBehavior,
      oneTimeInstruction: oneTimeInstruction || null
    });

    if (result.isOutreach === false) {
      return res.json({
        success: true,
        isOutreach: false,
        reason: result.reason || 'Not a hiring/requirement post.'
      });
    }

    return res.json({
      success: true,
      isOutreach: true,
      analysis: result.analysis || {},
      comment: result.comment || '',
      connectionNote: result.connectionNote || '',
      dm: result.dm || {},
      followup1: result.followup1 || '',
      followup2: result.followup2 || '',
      tip: result.tip || '',
      reason: result.reason || 'Outreach generated successfully.'
    });

  } catch (err) {
    console.error('[AI Assistant API Error - generate-outreach]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while generating outreach.'
    });
  }
});

// Generate all three styles (professional, insightful, short) in one call
router.post('/generate-comment-all', async (req, res) => {
  try {
    const validation = validateGenerateAllCommentsRequest(req);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.message });
    }

    const { post, persona, behavior, oneTimeInstruction } = req.body;

    const activeBehavior = {
      ...getBehaviorMemory(),
      ...(behavior || {})
    };

    console.log(`[AI Assistant API] Generating ALL styles for post by "${post.authorName || 'Unknown'}"`);

    const result = await generateAllComments({
      post,
      persona: persona || {},
      behavior: activeBehavior,
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
      comments: result.comments || {},
      dmPitch: result.dmPitch || '',
      relevance: typeof result.relevanceScore === 'number' ? result.relevanceScore : 0.9,
      intent: result.intent || 'general_discussion',
      reason: result.reason || 'Comments generated successfully.'
    });

  } catch (err) {
    console.error('[AI Assistant API Error - generate-comment-all]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while generating comments.'
    });
  }
});

// Recommends the single best-fitting comment tone for a post
router.post('/recommend-comment-tone', async (req, res) => {
  try {
    const validation = validateRecommendToneRequest(req);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.message });
    }

    const { post, persona, behavior } = req.body;

    const activeBehavior = {
      ...getBehaviorMemory(),
      ...(behavior || {})
    };

    console.log(`[AI Assistant API] Recommending tone for post by "${post.authorName || 'Unknown'}"`);

    const result = await generateToneRecommendation({
      post,
      persona: persona || {},
      behavior: activeBehavior
    });

    return res.json({
      success: true,
      recommendedTone: result.recommendedTone || 'professional',
      reason: result.reason || '',
      relevant: result.relevant !== false,
      relevance: typeof result.relevanceScore === 'number' ? result.relevanceScore : 0.9
    });

  } catch (err) {
    console.error('[AI Assistant API Error - recommend-comment-tone]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while recommending tone.'
    });
  }
});

module.exports = router;
