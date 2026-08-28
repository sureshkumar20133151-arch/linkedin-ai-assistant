/**
 * LinkedIn DOM Detector & Observer Module
 * Uses MutationObserver and event delegation to detect active comment composers.
 */

function findUnprocessedCommentComposers() {
  const composers = querySelectorAllFallback(document.body, LINKEDIN_SELECTORS.commentComposers);
  return composers.filter(composer => {
    return !composer.getAttribute('data-ai-assistant-toolbar');
  });
}

function observeLinkedInComposers(onComposerDetected) {
  // Initial check on load
  const initialComposers = findUnprocessedCommentComposers();
  initialComposers.forEach(composer => onComposerDetected(composer));

  // MutationObserver with throttling
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
        const newComposers = findUnprocessedCommentComposers();
        newComposers.forEach(composer => onComposerDetected(composer));
      }, 250);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return observer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findUnprocessedCommentComposers, observeLinkedInComposers };
}
