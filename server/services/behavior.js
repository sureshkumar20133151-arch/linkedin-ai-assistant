/**
 * Assistant Behavior Memory Management Service
 */

const { interpretBehaviorInstruction } = require('./gemini');

// In-memory initial state (can be synchronized with Chrome Extension storage or persistent storage)
let currentBehaviorMemory = {
  tone: "natural and professional",
  promotionLevel: "low",
  useEmojis: false,
  genericPraise: false,
  commentLength: "short",
  mentionServicesWhenRelevant: true,
  clientRequirementStyle: "direct but not salesy",
  activeInstructions: [
    "Don't start comments with 'Great post'",
    "Keep comments natural and non-promotional",
    "Don't use emojis"
  ]
};

function getBehaviorMemory() {
  return { ...currentBehaviorMemory };
}

function updateBehaviorMemory(newBehavior) {
  currentBehaviorMemory = {
    ...currentBehaviorMemory,
    ...newBehavior
  };
  return getBehaviorMemory();
}

function resetBehaviorMemory() {
  currentBehaviorMemory = {
    tone: "natural and professional",
    promotionLevel: "low",
    useEmojis: false,
    genericPraise: false,
    commentLength: "short",
    mentionServicesWhenRelevant: true,
    clientRequirementStyle: "direct but not salesy",
    activeInstructions: []
  };
  return getBehaviorMemory();
}

async function processNaturalLanguageInstruction(instruction, clientBehavior) {
  // IMPORTANT: this module's in-memory state (currentBehaviorMemory) does
  // NOT reliably survive across requests on serverless platforms like
  // Vercel — each cold start can reset it back to the defaults above.
  // The extension is the real source of truth (it persists behavior in
  // chrome.storage.local across sessions), so if the caller passes its
  // current locally-saved behavior, merge it in FIRST — unioning
  // activeInstructions rather than replacing — so previously-saved rules
  // are never silently dropped just because this server instance is cold.
  if (clientBehavior && typeof clientBehavior === 'object') {
    const existingRules = currentBehaviorMemory.activeInstructions || [];
    const clientRules = clientBehavior.activeInstructions || [];
    currentBehaviorMemory = {
      ...currentBehaviorMemory,
      ...clientBehavior,
      activeInstructions: [...new Set([...existingRules, ...clientRules])]
    };
  }

  try {
    const result = await interpretBehaviorInstruction(instruction, currentBehaviorMemory);

    if (result.isPermanent) {
      const existingRules = currentBehaviorMemory.activeInstructions || [];
      const newRules = Array.isArray(result.newInstructions) ? result.newInstructions : [];
      const removedRules = Array.isArray(result.removedInstructions) ? result.removedInstructions : [];

      // Remove first (exact text match against what's currently saved), then add new ones, deduped.
      const afterRemoval = existingRules.filter(r => !removedRules.includes(r));
      const mergedRules = [...new Set([...afterRemoval, ...newRules])];

      const mergedBehavior = {
        ...currentBehaviorMemory,
        ...(result.changedBehavior || {}),
        activeInstructions: mergedRules
      };
      updateBehaviorMemory(mergedBehavior);
    }

    return {
      success: true,
      isPermanent: result.isPermanent !== false,
      message: result.assistantResponse || 'Updated assistant behavior instructions.',
      behavior: getBehaviorMemory()
    };
  } catch (err) {
    // Basic heuristic fallback if API key isn't active yet
    const lower = instruction.toLowerCase();
    const updated = { ...currentBehaviorMemory };
    const newRules = [...(updated.activeInstructions || [])];

    if (lower.includes('no emoji') || lower.includes('don\'t use emoji') || lower.includes('stop using emoji')) {
      updated.useEmojis = false;
      newRules.push("Don't use emojis");
    }
    if (lower.includes('short')) {
      updated.commentLength = "short";
      newRules.push("Keep comments short");
    }
    if (lower.includes('salesy') || lower.includes('promotional')) {
      updated.promotionLevel = "low";
      newRules.push("Don't sound salesy or overly promotional");
    }
    if (lower.includes('great post')) {
      updated.genericPraise = false;
      newRules.push("Don't start with 'Great post'");
    }

    updated.activeInstructions = [...new Set(newRules)];
    updateBehaviorMemory(updated);

    return {
      success: true,
      isPermanent: true,
      message: `Updated behavior memory rule based on instruction: "${instruction}"`,
      behavior: getBehaviorMemory()
    };
  }
}

module.exports = {
  getBehaviorMemory,
  updateBehaviorMemory,
  resetBehaviorMemory,
  processNaturalLanguageInstruction
};
