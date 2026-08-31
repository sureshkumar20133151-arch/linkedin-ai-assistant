/**
 * LinkedIn DOM Detector & Observer Module
 * Uses MutationObserver and event delegation to detect active comment composers.
 */

function findUnprocessedCommentComposers() {
  const canonicalContainers = new Set();

  const targets = document.querySelectorAll(
    'div[contenteditable="true"], .comments-comment-box, .feed-shared-comment-box, form.comments-comment-box__form'
  );

  targets.forEach(target => {
    // Find the outermost comment box container
    const container = target.closest(
      '.comments-comment-box, .feed-shared-comment-box, form.comments-comment-box__form, .comments-comment-box__editor-container'
    ) || target.parentElement;

    if (container) {
      const outerBox = container.closest('.comments-comment-box, .feed-shared-comment-box, article') || container;
      // Strict duplicate check: make sure neither the box nor any child has a toolbar
      if (
        !outerBox.getAttribute('data-ai-assistant-toolbar') &&
        !outerBox.querySelector('.linkedin-ai-toolbar-container')
      ) {
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
