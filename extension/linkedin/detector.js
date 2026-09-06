/**
 * LinkedIn DOM Detector & Observer Module
 * Uses MutationObserver and event delegation to detect active comment composers.
 */

function findUnprocessedCommentComposers() {
  const canonicalContainers = new Set();

  const targets = document.querySelectorAll(
    'div[contenteditable="true"], div[role="textbox"], .comments-comment-box, .feed-shared-comment-box, form.comments-comment-box__form, .comments-comment-texteditor, .comments-comment-box__editor-container, .comments-comment-box__form-container, .comments-comment-box--cr, .editor-content'
  );

  targets.forEach(target => {
    // Walk up to find the outermost form / comment box container
    const outerBox = target.closest(
      'form.comments-comment-box__form, .feed-shared-comment-box__form, .comments-comment-box, .feed-shared-comment-box, .comments-comment-box--cr'
    ) || target.closest(
      '.comments-comment-box__editor-container, .comments-comment-texteditor'
    ) || target.parentElement;

    if (outerBox) {
      // Make sure this container or any of its parent/child elements doesn't already have a toolbar or attribute
      const alreadyHasToolbar =
        outerBox.getAttribute('data-ai-assistant-toolbar') === 'true' ||
        outerBox.querySelector('.linkedin-ai-toolbar-container') !== null ||
        outerBox.closest('[data-ai-assistant-toolbar="true"]') !== null;

      if (!alreadyHasToolbar) {
        canonicalContainers.add(outerBox);
      }
    }
  });

  return Array.from(canonicalContainers);
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
  module.exports = { findUnprocessedCommentComposers, observeLinkedInComposers };
}
