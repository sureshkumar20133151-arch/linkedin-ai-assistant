/**
 * LinkedIn Messaging (DM inbox) Context Extractor
 *
 * Given a message compose editor, finds the enclosing conversation panel,
 * then pulls out:
 *   - recipient { name, headline }
 *   - conversation history [{ sender: 'me' | 'them', text }]
 *
 * Sender detection ("me" vs "them") does NOT rely on a specific LinkedIn
 * class name, since that's one of the least stable parts of chat UIs across
 * redesigns. Instead it uses a generic alignment heuristic: outgoing
 * (the user's own) messages are conventionally right-aligned in virtually
 * every chat UI, including LinkedIn's. This is deliberately independent of
 * exact class names — see messageSelectors.js for the selector-based parts.
 */

// Like querySelectorAllFallback, but stops at the FIRST selector that
// matches anything, instead of accumulating across every selector in the
// array (which would duplicate results for overlapping selectors).
function queryAllFirstMatch(parent, selectorArray) {
  if (!parent) return [];
  for (const selector of selectorArray) {
    const elements = parent.querySelectorAll(selector);
    if (elements && elements.length > 0) return Array.from(elements);
  }
  return [];
}

function cleanRecipientName(rawText) {
  if (!rawText) return null;
  const firstLine = rawText.split('\n')[0].trim();
  const cleaned = firstLine
    .replace(/\s*•.*$/gi, '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/\s+active\s+now.*$/gi, '')
    .replace(/\s+mobile.*$/gi, '')
    .replace(/\s*\d+\w*\s*ago.*$/gi, '')
    .trim();
  return (cleaned.length >= 2 && cleaned.length <= 60) ? cleaned : null;
}

function findConversationContainer(startElement) {
  if (!startElement) return null;

  // Fast primary match via closest
  const matched = startElement.closest(
    '.msg-overlay-conversation-bubble, .msg-convo-wrapper, .scaffold-layout__detail, [class*="msg-overlay"], .msg-form'
  );
  if (matched) return matched;

  let current = startElement;
  let depth = 0;
  while (current && depth < 20 && current !== document.body) {
    for (const selector of LINKEDIN_MESSAGE_SELECTORS.conversationContainers) {
      if (current.matches && current.matches(selector)) return current;
    }
    current = current.parentElement;
    depth++;
  }

  // Fallback: the full messaging page often has everything under one
  // scaffold container that a narrower walk-up might miss.
  return document.querySelector('.scaffold-layout__detail') || document.body;
}

function extractRecipientInfo(conversationContainer) {
  if (!conversationContainer) return { name: null, headline: null };

  let rawName = null;
  const profileLink = conversationContainer.querySelector(
    '.msg-overlay-bubble-header a[href*="/in/"], a.msg-thread__link-to-profile, .msg-entity-lockup a[href*="/in/"]'
  );
  if (profileLink && profileLink.innerText.trim()) {
    rawName = profileLink.innerText.trim();
  }

  if (!rawName) {
    const nameEl = querySelectorFallback(conversationContainer, LINKEDIN_MESSAGE_SELECTORS.recipientName);
    if (nameEl) rawName = nameEl.innerText.trim();
  }

  const headlineEl = querySelectorFallback(conversationContainer, LINKEDIN_MESSAGE_SELECTORS.recipientHeadline);

  return {
    name: cleanRecipientName(rawName),
    headline: headlineEl ? headlineEl.innerText.trim().replace(/\s+/g, ' ') : null
  };
}

// Best-effort heuristic: checks CSS class indicators first, then compares bubble's
// horizontal center against its container's center for right-aligned outgoing messages.
function guessSenderByAlignment(bubbleEl, containerRect) {
  try {
    const className = ((bubbleEl.className || '') + ' ' + (bubbleEl.parentElement?.className || '')).toLowerCase();
    if (className.includes('--me') || className.includes('from-me') || className.includes('--outgoing')) {
      return 'me';
    }
    if (className.includes('--other') || className.includes('from-other') || className.includes('--incoming')) {
      return 'them';
    }

    const rect = bubbleEl.getBoundingClientRect();
    if (!rect.width || !containerRect.width) return 'them';
    const bubbleCenter = rect.left + rect.width / 2;
    const containerCenter = containerRect.left + containerRect.width / 2;
    return bubbleCenter > containerCenter ? 'me' : 'them';
  } catch (err) {
    return 'them'; // Safe default — treat as incoming so we never mistake a client's message for the user's own.
  }
}

function extractConversationHistory(conversationContainer, maxMessages = 12) {
  if (!conversationContainer) return { messages: [] };

  const bubbles = queryAllFirstMatch(conversationContainer, LINKEDIN_MESSAGE_SELECTORS.messageBubbles);
  if (!bubbles.length) return { messages: [] };

  const recentBubbles = bubbles.slice(-maxMessages);
  const containerRect = conversationContainer.getBoundingClientRect();

  const messages = recentBubbles
    .map(bubble => {
      const textEl = querySelectorFallback(bubble, LINKEDIN_MESSAGE_SELECTORS.messageBubbleText) || bubble;
      const text = (textEl.innerText || textEl.textContent || '').trim();
      const sender = guessSenderByAlignment(bubble, containerRect);
      return { sender, text };
    })
    .filter(m => m.text && m.text.length > 0);

  return { messages };
}

async function extractMessageContext(composer) {
  const container = findConversationContainer(composer);
  const recipient = extractRecipientInfo(container);
  const conversation = extractConversationHistory(container);
  conversation.recipientName = recipient.name;
  return { recipient, conversation };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findConversationContainer, extractRecipientInfo, extractConversationHistory, extractMessageContext };
}
