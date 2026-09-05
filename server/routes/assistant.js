/**
 * Express router for Assistant Behavior Memory endpoints
 */

const express = require('express');
const router = express.Router();
const { 
  getBehaviorMemory, 
  updateBehaviorMemory, 
  resetBehaviorMemory, 
  processNaturalLanguageInstruction 
} = require('../services/behavior');
const { validateBehaviorRequest } = require('../utils/validation');

// GET current behavior memory
router.get('/assistant/behavior', (req, res) => {
  return res.json({
    success: true,
    behavior: getBehaviorMemory()
  });
});

// POST update behavior via natural language instruction or structured payload
router.post('/assistant/behavior', async (req, res) => {
  try {
    const { instruction, behavior, currentBehavior } = req.body;

    if (instruction) {
      const validation = validateBehaviorRequest(req);
      if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.message });
      }

      const result = await processNaturalLanguageInstruction(instruction, currentBehavior);
      return res.json(result);
    } else if (behavior && typeof behavior === 'object') {
      const updated = updateBehaviorMemory(behavior);
      return res.json({
        success: true,
        message: 'Behavior settings updated directly.',
        behavior: updated
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide either an "instruction" string or a "behavior" object.'
      });
    }
  } catch (err) {
    console.error('[Behavior Router Error]', err.message);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to update behavior memory.'
    });
  }
});

// DELETE / reset behavior memory to defaults
router.delete('/assistant/behavior', (req, res) => {
  const reset = resetBehaviorMemory();
  return res.json({
    success: true,
    message: 'Assistant behavior memory reset to default state.',
    behavior: reset
  });
});

module.exports = router;
