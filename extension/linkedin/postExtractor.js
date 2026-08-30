/**
 * LinkedIn Post Context Extractor
 * Extracts the full post text relative to where the AI toolbar was injected.
 * 
 * Key challenge: On search results pages, LinkedIn truncates posts behind "...more".
 * This module clicks "...more" first, then extracts the expanded text.
 */

/**
 * Walk up from the composer to find the outermost post container.
 * On search results, the structure is roughly:
 *   div.feed-shared-update-v2  (← we want this)
 *     ├── actor info (name, headline)
 *     ├── post text (.update-components-text)  
 *     ├── social actions (like, comment, share buttons)
 *     └── comments section
 *          └── comment box (← toolbar is injected here)
 */
function findPostForCommentComposer(commentComposer) {
  if (!commentComposer) return null;

  // Strategy 1: Use closest() with known post container selectors
  const containerSelectors = [
    'div.feed-shared-update-v2',
    'article',
    'div[data-urn]',
    'div[data-urn*="activity"]',
    'div[data-urn*="ugcPost"]',
    'div.occluded-update',
    'li.reusable-search__result-container',
    'div.reusable-search__result-container',
    'div.entity-result'
  ];

  for (const selector of containerSelectors) {
    const container = commentComposer.closest(selector);
    if (container) {
      console.log(`[AI Assistant] Found post container via closest('${selector}')`);
      return container;
    }
  }

  // Strategy 2: Walk up until we find an element that has BOTH post text AND author info
  let current = commentComposer.parentElement;
  let depth = 0;
  while (current && depth < 25 && current !== document.body) {
    const hasText = current.querySelector('.update-components-text, .feed-shared-inline-show-more-text, .feed-shared-text-view, span.break-words');
    const hasActor = current.querySelector('.update-components-actor__name, .feed-shared-actor__name');
    
    if (hasText && hasActor) {
      console.log(`[AI Assistant] Found post container via traversal at depth ${depth}`);
      return current;
    }
    current = current.parentElement;
    depth++;
  }

  // Strategy 3: Walk up to find any element with substantial text (>100 chars) that isn't just the comment section
  current = commentComposer.parentElement;
  depth = 0;
  while (current && depth < 25 && current !== document.body) {
    const text = current.innerText || '';
    if (
      text.length > 100 &&
      !current.classList.contains('linkedin-ai-toolbar-container') &&
      !current.classList.contains('comments-comment-box') &&
      text.includes('\n')  // Posts typically have multiple lines
    ) {
      console.log(`[AI Assistant] Found post container via text length (${text.length} chars) at depth ${depth}`);
      return current;
    }
    current = current.parentElement;
    depth++;
  }

  console.warn('[AI Assistant] Could not find post container, using broad parent');
  return commentComposer.closest('article, li, div') || commentComposer.parentElement;
}

/**
 * Click "...more" / "see more" to expand truncated post text.
 */
function expandPostText(postElement) {
  if (!postElement) return false;

  // Find ALL clickable elements inside the post
  const clickables = postElement.querySelectorAll('button, a, span[role="button"]');
  
  for (const el of clickables) {
    const text = (el.innerText || el.textContent || '').trim().toLowerCase();
    // Match: "...more", "…more", "see more", "more" (but NOT "no more", "learn more about")
    if (
      (text === 'more' || text === '...more' || text === '…more' || text === 'see more' || text === '…see more') &&
      !text.includes('less') &&
      !text.includes('learn') &&
      el.offsetParent !== null  // element is visible
    ) {
      console.log(`[AI Assistant] Clicking "${text}" to expand post`);
      el.click();
      return true;
    }
  }

  // Also check for LinkedIn's specific "see more" aria-labels
  const ariaMore = postElement.querySelector('button[aria-label*="see more"], button[aria-label*="See more"]');
  if (ariaMore && ariaMore.offsetParent !== null) {
    console.log('[AI Assistant] Clicking see-more via aria-label');
    ariaMore.click();
    return true;
  }

  return false;
}

/**
 * Extract the post text from within the post container.
 * Tries multiple strategies to get the cleanest, most complete text.
 */
function extractTextFromPost(postElement) {
  if (!postElement) return '';

  // Strategy 1: Use known post text selectors (including Search Result page selectors)
  const textSelectors = [
    '.update-components-text',
    '.feed-shared-inline-show-more-text',
    '.feed-shared-update-v2__commentary',
    '.feed-shared-text-view',
    '.feed-shared-text',
    '.entity-result__summary',
    '.entity-result__content',
    'span.break-words',
    '.feed-shared-update-v2__description-wrapper',
    'span[dir="ltr"]',
    'p[dir="ltr"]'
  ];

  for (const selector of textSelectors) {
    const elements = postElement.querySelectorAll(selector);
    for (const textEl of elements) {
      // Exclude text inside comments section or comment replies!
      if (textEl.closest('.comments-comments-list, .comments-comment-item, .comments-comment-box, .comments-reply-item')) {
        continue;
      }

      const clone = textEl.cloneNode(true);
      // Remove buttons, toolbars, "see more" links from clone
      clone.querySelectorAll('button, .linkedin-ai-toolbar-container, .feed-shared-inline-show-more-text__see-more-less-toggle, .linkedin-ai-recommend-banner').forEach(el => el.remove());
      const text = clone.innerText.trim().replace(/\n{3,}/g, '\n\n');
      if (text.length > 20) {
        console.log(`[AI Assistant] Text extracted via selector '${selector}' (${text.length} chars)`);
        return text;
      }
    }
  }

  // Strategy 2: Find the longest text block inside the post (excluding comments/toolbar)
  let longestText = '';
  const allNodes = postElement.querySelectorAll('span, div, p');
  for (const node of allNodes) {
    // Skip our toolbar, comment boxes, and interactive elements
    if (node.closest('.linkedin-ai-toolbar-container')) continue;
    if (node.closest('.comments-comment-box')) continue;
    if (node.closest('.comments-comment-texteditor')) continue;
    if (node.closest('.comments-comments-list')) continue;
    if (node.tagName === 'BUTTON') continue;

    const text = (node.innerText || '').trim();
    if (
      text.length > longestText.length &&
      text.length > 30 &&
      !text.includes('AI Comment') &&
      !text.includes('Choose Tone') &&
      !text.includes('Recommended') &&
      !text.includes('One-time instruction') &&
      !text.includes('Add a comment')
    ) {
      longestText = text;
    }
  }

  if (longestText.length > 30) {
    console.log(`[AI Assistant] Text extracted via longest-node scan (${longestText.length} chars)`);
    return longestText;
  }

  // Strategy 3: Take the full innerText of the post and clean it
  const fullText = postElement.innerText || '';
  const lines = fullText.split('\n')
    .map(l => l.trim())
    .filter(l =>
      l.length > 10 &&
      !l.includes('Add a comment') &&
      !l.includes('AI Comment') &&
      !l.includes('Professional') &&
      !l.includes('Insightful') &&
      !l.includes('Short') &&
      !l.includes('Most relevant') &&
      !l.includes('One-time instruction') &&
      !l.includes('GIF') &&
      !l.match(/^\d+$/) &&         // skip standalone numbers (like counts)
      !l.match(/^Like$|^Comment$|^Share$|^Send$|^Repost$/)
    );

  if (lines.length > 0) {
    const cleaned = lines.join('\n');
    console.log(`[AI Assistant] Text extracted via line-filter (${cleaned.length} chars)`);
    return cleaned;
  }

  return '';
}

async function extractPostContext(commentComposer) {
  const postElement = findPostForCommentComposer(commentComposer);

  if (!postElement) {
    console.warn('[AI Assistant] No post container found.');
    return {
      authorName: 'LinkedIn User',
      authorHeadline: '',
      postText: '',
      hashtags: []
    };
  }

  // STEP 1: Expand "...more" before extraction
  const wasExpanded = expandPostText(postElement);
  if (wasExpanded) {
    // Wait for LinkedIn's React to re-render the expanded text
    await new Promise(r => setTimeout(r, 500));
  }

  // Extract author name (ignore commenters in comments section)
  const nameSelectors = [
    '.update-components-actor__name span span[aria-hidden="true"]',
    '.update-components-actor__name',
    '.feed-shared-actor__name',
    '.entity-result__title-text',
    '.update-components-actor__title',
    'span[data-anonymize="person-name"]'
  ];
  let authorName = '';
  for (const sel of nameSelectors) {
    const elements = postElement.querySelectorAll(sel);
    for (const el of elements) {
      if (el.closest('.comments-comments-list, .comments-comment-item, .comments-comment-box')) continue;
      const text = el.innerText.trim();
      if (text) {
        authorName = text.split('\n')[0];
        break;
      }
    }
    if (authorName) break;
  }
  if (!authorName || authorName.length > 50) authorName = 'LinkedIn User';

  // Extract author headline (ignore commenters and post summary)
  const headlineSelectors = [
    '.update-components-actor__description span[aria-hidden="true"]',
    '.update-components-actor__description',
    '.feed-shared-actor__sub-description',
    '.update-components-actor__sub-description span[aria-hidden="true"]'
  ];
  let authorHeadline = '';
  for (const sel of headlineSelectors) {
    const elements = postElement.querySelectorAll(sel);
    for (const el of elements) {
      if (el.closest('.comments-comments-list, .comments-comment-item, .comments-comment-box')) continue;
      const text = el.innerText.trim();
      if (text) {
        authorHeadline = text.replace(/\s+/g, ' ');
        break;
      }
    }
    if (authorHeadline) break;
  }

  // STEP 2: Extract the actual post text
  let postText = extractTextFromPost(postElement);

  // If still empty after expansion, try expanding again with a longer wait
  if (!postText || postText.length < 20) {
    const expandedAgain = expandPostText(postElement);
    if (expandedAgain) {
      await new Promise(r => setTimeout(r, 800));
      postText = extractTextFromPost(postElement);
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
    postText: postText || '',
    hashtags: [...new Set(hashtags)]
  };

  console.log(`[AI Assistant] ===== EXTRACTION RESULT =====`);
  console.log(`[AI Assistant] Author: "${authorName}"`);
  console.log(`[AI Assistant] Headline: "${authorHeadline}"`);
  console.log(`[AI Assistant] Post text (${postText.length} chars): "${postText.substring(0, 200)}..."`);
  console.log(`[AI Assistant] Hashtags: ${hashtags.join(', ')}`);

  return result;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findPostForCommentComposer, extractPostContext, expandPostText };
}
