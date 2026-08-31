/**
 * Chrome Extension Background Service Worker (Manifest V3)
 */

// Load shared DEFAULT_PERSONA from the single source of truth
importScripts('shared/config.js');

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
      backendUrl: 'https://linkedin-ai-assistant-dun.vercel.app'
    });
  }
});

// Listens for manual 'Analyze Profile' requests from the content script,
// opens the profile in a background tab, extracts details, closes the tab,
// and returns the profile context.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'ANALYZE_PROFILE' && request.profileUrl) {
    analyzeProfileInBackground(request.profileUrl)
      .then(profileData => sendResponse({ success: true, profileData }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Async response
  }
});

async function analyzeProfileInBackground(profileUrl) {
  const tab = await chrome.tabs.create({ url: profileUrl, active: false });

  try {
    // Wait for the profile tab to finish loading (max 15s to avoid permanent tab leak
    // if LinkedIn shows a login wall, redirect, or slow network)
    await Promise.race([
      new Promise((resolve) => {
        function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        }
        chrome.tabs.onUpdated.addListener(listener);
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile tab load timed out after 15 seconds.')), 15000)
      )
    ]);

    await new Promise(r => setTimeout(r, 1500));

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['linkedin/profileExtractor.js']
    });

    if (results && results[0]) {
      const evalResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => extractProfileContext(document)
      });
      return evalResult && evalResult[0] ? evalResult[0].result : null;
    }
    return null;
  } finally {
    if (tab && tab.id) {
      chrome.tabs.remove(tab.id).catch(() => {});
    }
  }
}

