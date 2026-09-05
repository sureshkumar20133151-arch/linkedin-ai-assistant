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
    'div.entity-result',
    'div.update-outlet',
    'div.feed-shared-single-update',
    'div.profile-creator-shared-feed-update',
    'div.pv-profile-activity-card',
    'main.scaffold-layout__main',
    'div.scaffold-layout__main'
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

  // STEP 1: Create a clean clone of postElement with all toolbars, comment boxes, and banners completely removed
  const cleanPostNode = postElement.cloneNode(true);
  cleanPostNode.querySelectorAll(
    '.linkedin-ai-toolbar-container, ' +
    '.linkedin-ai-recommend-banner, ' +
    '.linkedin-ai-notice, ' +
    '.comments-comment-box, ' +
    '.comments-comments-list, ' +
    '.comments-comment-texteditor, ' +
    '.comments-reply-item, ' +
    'button'
  ).forEach(el => el.remove());

  // STEP 2: Try specific post text selectors on the clean node
  const textSelectors = [
    '.update-components-text',
    '.feed-shared-inline-show-more-text',
    '.feed-shared-update-v2__commentary',
    '.feed-shared-text-view',
    '.feed-shared-text',
    '.entity-result__summary',
    '.entity-result__content',
    '.feed-shared-update-v2__description-wrapper'
  ];

  for (const selector of textSelectors) {
    const elements = cleanPostNode.querySelectorAll(selector);
    for (const textEl of elements) {
      const text = (textEl.innerText || textEl.textContent || '')
        .trim()
        .replace(/\n{3,}/g, '\n\n');

      if (text.length >= 15 && !text.includes('AI COMMENT') && !text.includes('Choose Tone')) {
        console.log(`[AI Assistant] Text extracted via selector '${selector}' (${text.length} chars)`);
        return text;
      }
    }
  }

  // STEP 3: Find the longest text block in cleanPostNode
  let longestText = '';
  const candidateNodes = cleanPostNode.querySelectorAll('span, div, p');
  for (const node of candidateNodes) {
    const text = (node.innerText || node.textContent || '').trim();
    if (
      text.length > longestText.length &&
      text.length > 25 &&
      !text.includes('AI COMMENT') &&
      !text.includes('Choose Tone') &&
      !text.includes('Recommended:') &&
      !text.includes('One-time instruction')
    ) {
      longestText = text;
    }
  }

  if (longestText.length > 25) {
    console.log(`[AI Assistant] Text extracted via longest-node scan (${longestText.length} chars)`);
    return longestText;
  }

  // STEP 4: Fallback to full cleaned innerText
  const fullText = (cleanPostNode.innerText || cleanPostNode.textContent || '').trim();
  const lines = fullText.split('\n')
    .map(l => l.trim())
    .filter(l =>
      l.length > 15 &&
      !l.includes('AI COMMENT') &&
      !l.includes('Choose Tone') &&
      !l.includes('Recommended') &&
      !l.includes('One-time instruction') &&
      !l.match(/^\d+$/) &&
      !l.match(/^Like$|^Comment$|^Share$|^Send$|^Repost$/i)
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

  // Helper to check if an element is inside any comment section
  function isInsideCommentsSection(el) {
    if (!el) return false;
    return !!el.closest(
      '.comments-comments-list, ' +
      '.comments-comment-item, ' +
      '.comments-comment-box, ' +
      '.comments-post-meta, ' +
      '.comments-comment-entity, ' +
      '.comments-reply-item, ' +
      '.comments-comment-item__main-content, ' +
      '[class*="comments-"], ' +
      '[class*="comment-"]'
    );
  }

  // Locate top actor header of the post
  const actorHeader = postElement.querySelector(
    '.update-components-actor, ' +
    '.feed-shared-actor, ' +
    '.entity-result__actor-container, ' +
    '.feed-shared-update-v2__actor, ' +
    '.update-components-actor__container, ' +
    'div[class*="actor"]'
  );

  const actorScope = (actorHeader && !isInsideCommentsSection(actorHeader)) ? actorHeader : postElement;

  // Extract author name (ignore commenters in comments section)
  const nameSelectors = [
    '.update-components-actor__name span[aria-hidden="true"]',
    '.update-components-actor__name',
    '.feed-shared-actor__name span[aria-hidden="true"]',
    '.feed-shared-actor__name',
    '.update-components-actor__title span[aria-hidden="true"]',
    '.update-components-actor__title',
    '.entity-result__title-text a',
    '.entity-result__title-text',
    'span[data-anonymize="person-name"]'
  ];
  let authorName = '';
  for (const sel of nameSelectors) {
    const elements = actorScope.querySelectorAll(sel);
    for (const el of elements) {
      if (isInsideCommentsSection(el)) continue;
      let text = (el.innerText || el.textContent || '').trim();
      if (text) {
        text = text.split('\n')[0]
                   .replace(/\s*•\s*(1st|2nd|3rd\+?|\d+\w*)\s*/gi, '')
                   .replace(/\s*•\s*Author\s*/gi, '')
                   .replace(/\s*•\s*Following\s*/gi, '')
                   .replace(/\s*•\s*You\s*/gi, '')
                   .replace(/\s*\+?\s*Follow\s*/gi, '')
                   .trim();
        if (text && text.length >= 2 && text.length <= 60 && !text.toLowerCase().includes('comment')) {
          authorName = text;
          break;
        }
      }
    }
    if (authorName) break;
  }
  if (!authorName || authorName.length > 50) authorName = 'LinkedIn User';

  // Extract author headline (ignore commenters and post summary)
  const headlineSelectors = [
    '.update-components-actor__description span[aria-hidden="true"]',
    '.update-components-actor__description',
    '.feed-shared-actor__sub-description span[aria-hidden="true"]',
    '.feed-shared-actor__sub-description',
    '.update-components-actor__sub-description span[aria-hidden="true"]',
    '.entity-result__primary-subtitle'
  ];
  let authorHeadline = '';
  for (const sel of headlineSelectors) {
    const elements = actorScope.querySelectorAll(sel);
    for (const el of elements) {
      if (isInsideCommentsSection(el)) continue;
      const text = (el.innerText || el.textContent || '').trim();
      if (text && !text.includes(authorName)) {
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

  // Extract author profile URL (ignore links inside comments section)
  const linkSelectors = [
    'a.update-components-actor__meta-link',
    'a.update-components-actor__image',
    'a.feed-shared-actor__container-link',
    'a.app-aware-link[href*="/in/"]',
    'a[href*="/in/"]'
  ];
  let authorProfileUrl = '';
  for (const sel of linkSelectors) {
    const elements = actorScope.querySelectorAll(sel);
    for (const el of elements) {
      if (isInsideCommentsSection(el)) continue;
      const href = el.getAttribute('href') || el.href || '';
      if (href.includes('/in/')) {
        const match = href.match(/(https?:\/\/[^\/]*linkedin\.com\/in\/[^\/\?#]+)/);
        authorProfileUrl = match ? match[1] : href.split('?')[0];
        break;
      }
    }
    if (authorProfileUrl) break;
  }

  // Extract hashtags
  const hashtagEls = postElement.querySelectorAll('a[href*="/hashtag/"]');
  const hashtags = Array.from(hashtagEls)
    .map(el => el.innerText.trim())
    .filter(tag => tag.startsWith('#'));

  const result = {
    authorName,
    authorHeadline,
    authorProfileUrl: authorProfileUrl || '',
    postText: postText || '',
    hashtags: [...new Set(hashtags)]
  };

  console.log(`[AI Assistant] ===== EXTRACTION RESULT =====`);
  console.log(`[AI Assistant] Author: "${authorName}"`);
  console.log(`[AI Assistant] Profile URL: "${authorProfileUrl}"`);
  console.log(`[AI Assistant] Headline: "${authorHeadline}"`);
  console.log(`[AI Assistant] Post text (${postText.length} chars): "${postText.substring(0, 200)}..."`);
  console.log(`[AI Assistant] Hashtags: ${hashtags.join(', ')}`);

  return result;
}


/**
 * Extract top existing comments from the post for competitive gap analysis.
 * Returns an array of { name, text } objects (max 8 comments).
 * Carefully scoped to ONLY the comments list — never bleeds into post text.
 */
function extractExistingComments(postElement) {
  if (!postElement) return [];

  const commentsList = postElement.querySelector(
    '.comments-comments-list, .comments-list, [class*="comments-list"]'
  );
  if (!commentsList) return [];

  const comments = [];
  const commentItems = commentsList.querySelectorAll(
    '.comments-comment-item, .comments-comment-entity, [class*="comment-item"]'
  );

  for (const item of commentItems) {
    // Skip nested reply items
    if (item.closest('.comments-comment-item .comments-comment-item')) continue;

    // Commenter name
    const nameEl = item.querySelector(
      '.comments-post-meta__name-text span[aria-hidden="true"], ' +
      '.comments-post-meta__name-text, ' +
      '.comment-actor-name, ' +
      'span[data-anonymize="person-name"]'
    );
    const name = nameEl ? (nameEl.innerText || nameEl.textContent || '').trim().split('\n')[0] : '';

    // Comment text — expand "...more" if present
    const seeMoreBtn = item.querySelector('button.comments-comment-item__inline-show-more-text');
    if (seeMoreBtn && seeMoreBtn.offsetParent !== null) {
      seeMoreBtn.click();
    }

    const textEl = item.querySelector(
      '.comments-comment-item__main-content, ' +
      '.update-components-text, ' +
      'span[dir="ltr"]'
    );
    const text = textEl ? (textEl.innerText || textEl.textContent || '').trim() : '';

    if (name && text && text.length > 10) {
      comments.push({ name, text: text.substring(0, 400) });
    }

    if (comments.length >= 8) break;
  }

  return comments;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findPostForCommentComposer, extractPostContext, expandPostText, extractExistingComments };
}
