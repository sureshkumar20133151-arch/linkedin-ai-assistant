/**
 * LinkedIn Post Context Extractor
 * Strictly isolates and extracts post context relative to the active comment composer.
 * Handles truncated posts by expanding "...more" before extraction.
 */

function findPostForCommentComposer(commentComposer) {
  if (!commentComposer) return null;

  // 1. Try traversal via closest() with defined post container selectors
  for (const selector of LINKEDIN_SELECTORS.postContainers) {
    const postContainer = commentComposer.closest(selector);
    if (postContainer) {
      const textCheck = querySelectorFallback(postContainer, LINKEDIN_SELECTORS.postText);
      if (textCheck || postContainer.innerText.length > 50) {
        return postContainer;
      }
    }
  }

  // 2. Dynamic Upward Traversal (up to 20 parent levels)
  // Finds the nearest ancestor that contains post commentary text or actor details
  let current = commentComposer.parentElement;
  let depth = 0;
  while (current && depth < 20 && current !== document.body) {
    // Check if current ancestor contains any known post text container
    const hasTextNode = querySelectorFallback(current, LINKEDIN_SELECTORS.postText);
    const hasActorNode = querySelectorFallback(current, LINKEDIN_SELECTORS.authorName);

    if (hasTextNode || hasActorNode) {
      return current;
    }

    // Check if current ancestor has significant text content excluding buttons/toolbars
    const rawText = current.innerText ? current.innerText.trim() : '';
    if (
      rawText.length > 40 &&
      !current.classList.contains('linkedin-ai-toolbar-container') &&
      (current.tagName === 'ARTICLE' || current.tagName === 'LI' || current.tagName === 'DIV')
    ) {
      return current;
    }

    current = current.parentElement;
    depth++;
  }

  return commentComposer.closest('article, li, div') || commentComposer.parentElement;
}

/**
 * Click "...more" / "see more" button inside a post to expand truncated text.
 * LinkedIn hides full post text behind this button on search results and feed.
 */
function expandPostText(postElement) {
  if (!postElement) return;

  // All known selectors for the "...more" / "see more" button
  const seeMoreSelectors = [
    'button.feed-shared-inline-show-more-text__button',
    'button[aria-label*="see more"]',
    'button[aria-label*="more"]',
    'a.feed-shared-inline-show-more-text__see-more-less-toggle',
    '.feed-shared-inline-show-more-text button',
    'button.see-more',
    'span.feed-shared-inline-show-more-text__see-more-less-toggle',
    // Search results page variant
    '.update-components-text button',
    '.update-components-text__see-more',
    'button.update-components-text__see-more'
  ];

  for (const selector of seeMoreSelectors) {
    const btn = postElement.querySelector(selector);
    if (btn) {
      const btnText = (btn.innerText || btn.textContent || '').toLowerCase().trim();
      // Only click if it says "more" or "see more" (not "less")
      if (btnText.includes('more') && !btnText.includes('less')) {
        console.log('[AI Assistant] Expanding truncated post via "...more" button');
        btn.click();
        return true;
      }
    }
  }

  // Fallback: look for any button/link inside the post text area that contains "more"
  const textContainer = querySelectorFallback(postElement, LINKEDIN_SELECTORS.postText);
  if (textContainer) {
    const btns = textContainer.querySelectorAll('button, a');
    for (const btn of btns) {
      const btnText = (btn.innerText || btn.textContent || '').toLowerCase().trim();
      if (btnText.includes('more') && !btnText.includes('less') && btnText.length < 20) {
        console.log('[AI Assistant] Expanding truncated post via fallback "more" element');
        btn.click();
        return true;
      }
    }
  }

  return false;
}

async function extractPostContext(commentComposer) {
  const postElement = findPostForCommentComposer(commentComposer);

  if (!postElement) {
    console.warn('[AI Assistant] Fallback to document context.');
    return {
      authorName: 'LinkedIn User',
      authorHeadline: '',
      postText: 'LinkedIn post content',
      hashtags: []
    };
  }

  // STEP 1: Expand "...more" before extraction
  const wasExpanded = expandPostText(postElement);
  if (wasExpanded) {
    // Wait for LinkedIn to render the full text
    await new Promise(r => setTimeout(r, 300));
  }

  // Extract author name
  const nameEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.authorName);
  let authorName = nameEl ? nameEl.innerText.trim().split('\n')[0] : '';
  if (!authorName || authorName.length > 50) authorName = 'LinkedIn User';

  // Extract author headline / sub-description
  const headlineEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.authorHeadline);
  const authorHeadline = headlineEl ? headlineEl.innerText.trim().replace(/\s+/g, ' ') : '';

  // Extract post text using primary selectors
  let postText = '';
  const textEl = querySelectorFallback(postElement, LINKEDIN_SELECTORS.postText);

  if (textEl) {
    const clone = textEl.cloneNode(true);
    // Remove the "see more/less" buttons from cloned text
    const removeEls = clone.querySelectorAll(
      '.feed-shared-inline-show-more-text__button, button, .linkedin-ai-toolbar-container, ' +
      '.feed-shared-inline-show-more-text__see-more-less-toggle'
    );
    removeEls.forEach(el => el.remove());
    postText = clone.innerText.trim().replace(/\n+/g, '\n');
  }

  // Fallback 1: Sibling / Subtree Inspection if primary selector didn't catch text
  if (!postText || postText.length < 30) {
    const candidateNodes = postElement.querySelectorAll('span, div, p');
    let longestText = postText || '';
    for (const node of candidateNodes) {
      if (node.classList.contains('linkedin-ai-toolbar-container') || node.closest('.linkedin-ai-toolbar-container')) continue;
      if (node.closest('.comments-comment-box') || node.closest('.comments-comment-texteditor')) continue;
      const text = node.innerText ? node.innerText.trim() : '';
      if (
        text.length > longestText.length &&
        text.length > 25 &&
        !text.includes('Add a comment') &&
        !text.includes('Most relevant') &&
        !text.includes('AI Comment') &&
        !text.includes('Professional') &&
        !text.includes('Insightful')
      ) {
        longestText = text;
      }
    }
    if (longestText.length > postText.length) {
      postText = longestText;
    }
  }

  // Fallback 2: Clean full innerText of postElement excluding toolbar & comments
  if (!postText || postText.length < 30) {
    const fullText = postElement.innerText || '';
    const lines = fullText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 15 && !l.includes('Add a comment') && !l.includes('AI Comment') && !l.includes('Professional'));
    if (lines.length > 0) {
      postText = lines.join(' ');
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
    postText: postText || 'Unable to extract post text — please copy the post content into the instruction field above.',
    hashtags: [...new Set(hashtags)]
  };

  console.log(`[AI Assistant] Extracted Context for post by "${authorName}" (${postText.length} chars):`, result.postText.substring(0, 150));

  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findPostForCommentComposer, extractPostContext, expandPostText };
}
