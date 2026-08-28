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

  // 2. Fallback: Traverse parent elements up to 12 levels looking for article, urn, feed, or result container
  let current = commentComposer.parentElement;
  let depth = 0;
  while (current && depth < 14) {
    if (
      current.tagName === 'ARTICLE' ||
      current.classList.contains('feed-shared-update-v2') ||
      current.hasAttribute('data-urn') ||
      current.classList.contains('occluded-update') ||
      current.classList.contains('search-results__list-item') ||
      current.classList.contains('reusable-search__result-container') ||
      current.classList.contains('entity-result')
    ) {
      return current;
    }
    current = current.parentElement;
    depth++;
  }

  return commentComposer.parentElement ? commentComposer.parentElement.parentElement : null;
}

function extractPostContext(commentComposer) {
  const postElement = findPostForCommentComposer(commentComposer);

  if (!postElement) {
    console.warn('[AI Assistant] Could not isolate parent post element for composer.');
    return { authorName: '', authorHeadline: '', postText: '', hashtags: [] };
  }

  // Extract author name
  const nameEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.authorName);
  const authorName = nameEl ? nameEl.innerText.trim().split('\n')[0] : 'LinkedIn User';

  // Extract author headline / sub-description
  const headlineEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.authorHeadline);
  const authorHeadline = headlineEl ? headlineEl.innerText.trim().replace(/\s+/g, ' ') : '';

  // Extract post text using primary selectors
  let postText = '';
  const textEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.postText);

  if (textEl) {
    const clone = textEl.cloneNode(true);
    const seeMoreBtns = clone.querySelectorAll('.feed-shared-inline-show-more-text__button, button, .linkedin-ai-toolbar-container');
    seeMoreBtns.forEach(btn => btn.remove());
    postText = clone.innerText.trim().replace(/\n+/g, '\n');
  }

  // Fallback Text Extraction: If specific text container wasn't matched, inspect sibling nodes above comment box
  if (!postText || postText.length < 5) {
    const candidateNodes = postElement.querySelectorAll('span, div, p');
    for (const node of candidateNodes) {
      if (node.classList.contains('linkedin-ai-toolbar-container') || node.closest('.linkedin-ai-toolbar-container')) continue;
      if (node.children.length === 0 || (node.children.length === 1 && node.querySelector('span'))) {
        const text = node.innerText ? node.innerText.trim() : '';
        if (text.length > 20 && !text.includes('Add a comment') && !text.includes('Most relevant') && !text.includes('AI Comment')) {
          postText = text;
          break;
        }
      }
    }
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

  console.log(`[AI Assistant] Extracted Context for post by "${authorName}":`, result.postText.substring(0, 100));

  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findPostForCommentComposer, extractPostContext };
}
