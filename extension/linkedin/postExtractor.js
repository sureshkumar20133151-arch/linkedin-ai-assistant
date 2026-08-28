/**
 * LinkedIn Post Context Extractor
 * Strictly isolates and extracts post context relative to the active comment composer.
 */

function findPostForCommentComposer(commentComposer) {
  if (!commentComposer) return null;

  // 1. Try traversal via closest() with defined post container selectors
  for (const selector of LINKEDIN_SELECTORS.postContainers) {
    const postContainer = commentComposer.closest(selector);
    if (postContainer) {
      return postContainer;
    }
  }

  // 2. Fallback: Traverse parent elements up to 8 levels looking for data-urn or feed class
  let current = commentComposer.parentElement;
  let depth = 0;
  while (current && depth < 10) {
    if (
      current.tagName === 'ARTICLE' ||
      current.classList.contains('feed-shared-update-v2') ||
      current.hasAttribute('data-urn') ||
      current.classList.contains('occluded-update')
    ) {
      return current;
    }
    current = current.parentElement;
    depth++;
  }

  return null;
}

function extractPostContext(commentComposer) {
  const postElement = findPostForCommentComposer(commentComposer);

  if (!postElement) {
    console.warn('[AI Assistant] Could not isolate parent post element for composer.');
    return {
      authorName: '',
      authorHeadline: '',
      postText: '',
      hashtags: []
    };
  }

  // Extract author name
  const nameEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.authorName);
  const authorName = nameEl ? nameEl.innerText.trim().split('\n')[0] : '';

  // Extract author headline / sub-description
  const headlineEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.authorHeadline);
  const authorHeadline = headlineEl ? headlineEl.innerText.trim().replace(/\s+/g, ' ') : '';

  // Extract post commentary text
  const textEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.postText);
  let postText = '';
  if (textEl) {
    // Clone textEl to remove hidden aria spans or trailing "...see more" buttons if necessary
    const clone = textEl.cloneNode(true);
    const seeMoreBtns = clone.querySelectorAll('.feed-shared-inline-show-more-text__button, button');
    seeMoreBtns.forEach(btn => btn.remove());
    postText = clone.innerText.trim().replace(/\n+/g, '\n');
  }

  // Extract hashtags
  const hashtagEls = postElement.querySelectorAll('a[href*="/hashtag/"]');
  const hashtags = Array.from(hashtagEls)
    .map(el => el.innerText.trim())
    .filter(tag => tag.startsWith('#'));

  const result = {
    authorName,
    authorHeadline,
    postText,
    hashtags: [...new Set(hashtags)]
  };

  console.log(`[AI Assistant] Extracted Context for post by "${authorName}":`, result.postText.substring(0, 80) + '...');

  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findPostForCommentComposer, extractPostContext };
}
