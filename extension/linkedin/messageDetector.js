/**
 * LinkedIn Messaging DOM Detector & Observer Module
 * Mirrors detector.js but scoped to message compose editors, with an
 * explicit messaging-context guard so the generic contenteditable/role
 * fallback selector never accidentally matches the feed's comment editor.
 */

function findUnprocessedMessageComposers() {
  const foundComposers = new Set();

  const editors = querySelectorAllFallback(document.body, LINKEDIN_MESSAGE_SELECTORS.composeEditors);
  const isOnMessagingPage = window.location.pathname.includes('/messaging');

  editors.forEach(editor => {
    // Guard: only treat this as a DM compose box if it's actually inside a
    // messaging-related container, OR we're on the /messaging page itself.
    // This prevents the generic contenteditable/role=textbox fallback from
    // ever being confused with the feed's comment editor.
    const isMessagingContext = editor.closest('.msg-form, .msg-overlay-conversation-bubble, .msg-convo-wrapper, .scaffold-layout__detail, [class*="msg-"]');
    if (!isMessagingContext && !isOnMessagingPage) return;

    const composer = editor.closest('.msg-form') || editor;
    foundComposers.add(composer);
  });

  return Array.from(foundComposers).filter(composer => !composer.getAttribute('data-ai-assistant-msg-toolbar'));
}

function observeLinkedInMessageComposers(onComposerDetected) {
  const initialComposers = findUnprocessedMessageComposers();
  initialComposers.forEach(composer => onComposerDetected(composer));

  let debounceTimer = null;
  const observer = new MutationObserver(mutations => {
    let shouldCheck = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
        break;
      }
    }

    if (shouldCheck) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const newComposers = findUnprocessedMessageComposers();
        newComposers.forEach(composer => onComposerDetected(composer));
      }, 200);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findUnprocessedMessageComposers, observeLinkedInMessageComposers };
}
