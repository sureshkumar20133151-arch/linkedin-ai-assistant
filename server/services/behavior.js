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

async function processNaturalLanguageInstruction(instruction) {
  try {
    const result = await interpretBehaviorInstruction(instruction, currentBehaviorMemory);
    
    if (result.isPermanent && result.updatedBehavior) {
      updateBehaviorMemory(result.updatedBehavior);
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
