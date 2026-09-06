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
    // Find the specific composer container for this comment or reply box
    const specificBox = target.closest(
      'form.comments-comment-box__form, .comments-comment-box__editor-container, .comments-comment-texteditor, .comments-comment-box--cr, .feed-shared-comment-box__form, .feed-shared-comment-box'
    ) || target.parentElement;

    if (specificBox) {
      // Make sure this specific composer box does not already have a toolbar
      if (
        !specificBox.getAttribute('data-ai-assistant-toolbar') &&
        !specificBox.querySelector('.linkedin-ai-toolbar-container')
      ) {
        canonicalContainers.add(specificBox);
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
