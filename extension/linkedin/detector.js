/**
 * LinkedIn DOM Detector & Observer Module
 * Uses MutationObserver and event delegation to detect active comment composers.
 */

function findUnprocessedCommentComposers() {
  const foundComposers = new Set();

  // 1. Query using known composer class selectors
  const composerElements = querySelectorAllFallback(document.body, LINKEDIN_SELECTORS.commentComposers);
  composerElements.forEach(el => foundComposers.add(el));

  // 2. Query contenteditable editors directly to catch newly rendered forms
  const editableEditors = document.querySelectorAll('div[contenteditable="true"]');
  editableEditors.forEach(editor => {
    const parentContainer = editor.closest('.comments-comment-box, .feed-shared-comment-box, form.comments-comment-box__form, .comments-comment-texteditor, .comments-comment-box__editor-container') || editor.parentElement;
    if (parentContainer) {
      foundComposers.add(parentContainer);
    }
  });

  return Array.from(foundComposers).filter(composer => {
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
