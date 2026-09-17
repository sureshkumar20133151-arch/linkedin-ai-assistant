/**
 * ICP (Ideal Client Persona) Research Route
 * POST /api/generate-icp
 *
 * Generates a full 33-section International Ideal Client Persona report
 * as markdown using the user's business offer information.
 */

const express = require('express');
const router = express.Router();

const { generateICPReport } = require('../services/gemini');

router.post('/generate-icp', async (req, res) => {
  try {
    const {
      targetAudience,
      whatYouHelp,
      howYouHelp,
      desiredResult,
      countries,
      pricePoint,
      persona
    } = req.body;

    if (!targetAudience || !targetAudience.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Target audience is required to generate an ICP report.'
      });
    }

    console.log(`[AI Assistant API] Generating ICP Report for target: "${targetAudience}"`);

    const report = await generateICPReport({
      targetAudience: targetAudience.trim(),
      whatYouHelp: (whatYouHelp || '').trim(),
      howYouHelp: (howYouHelp || '').trim(),
      desiredResult: (desiredResult || '').trim(),
      countries: (countries || '').trim(),
      pricePoint: (pricePoint || '').trim(),
      persona: persona || {}
    });

    return res.json({
      success: true,
      report,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('[AI Assistant API Error - generate-icp]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while generating ICP report.'
    });
  }
});

module.exports = router;
