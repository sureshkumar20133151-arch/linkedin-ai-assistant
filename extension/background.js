/**
 * Chrome Extension Background Service Worker (Manifest V3)
 */

const DEFAULT_PERSONA = {
  role: "Website Developer",
  skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "APIs", "Automation", "Web Applications"],
  services: [
    "Business Website Development",
    "Web Application Development",
    "Ecommerce Website Development",
    "API Integration",
    "Automation",
    "Custom Web Solutions"
  ],
  targetAudience: [
    "Small business owners",
    "Entrepreneurs",
    "Startups",
    "Businesses looking for websites",
    "People looking for developers"
  ],
  tone: "Professional, Natural, Helpful, Confident, Not overly promotional"
};

const DEFAULT_BEHAVIOR = {
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

chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === 'install') {
    console.log('[AI Assistant] Initializing default storage settings...');
    chrome.storage.local.set({
      persona: DEFAULT_PERSONA,
      assistantBehavior: DEFAULT_BEHAVIOR,
      backendUrl: 'http://localhost:3000'
    });
  }
});
