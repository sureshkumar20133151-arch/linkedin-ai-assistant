/**
 * LinkedIn Selector & DOM Isolation Module
 * Contains resilient, modular fallback selectors for LinkedIn dynamic SPA DOM.
 */

const LINKEDIN_SELECTORS = {
  // Post container parent selectors (ranked by specificity & semantic stability)
  postContainers: [
    'div.feed-shared-update-v2',
    'article[data-urn]',
    'div[data-urn*="activity"]',
    'div[data-urn*="ugcPost"]',
    'div.occluded-update',
    'div.feed-shared-update-v2__control-menu-container',
    'div[data-id*="urn:li:activity"]',
    'div.search-results-container article',
    'div.update-components-text'
  ],

  // Comment composer container selectors (including Search results & feed updates)
  commentComposers: [
    '.comments-comment-box',
    '.comments-comment-box__form',
    '.feed-shared-comment-box',
    '.comments-comment-texteditor',
    '.comments-comment-box--cr',
    '.comments-comment-box__editor-container',
    '.comments-comment-box__form-container',
    '.feed-shared-update-v2__comments-container'
  ],

  // Text editor inside comment composer
  commentEditors: [
    'div[contenteditable="true"]',
    '.ql-editor',
    '.comments-comment-box-comment__text-editor [contenteditable="true"]',
    'div.editor-content [contenteditable="true"]',
    '.comments-comment-texteditor [contenteditable="true"]'
  ],

  // Author details selectors within post container
  authorName: [
    '.update-components-actor__name',
    '.feed-shared-actor__name',
    '.actor-name',
    'span[data-anonymize="person-name"]',
    '.update-components-actor__title span span[aria-hidden="true"]',
    '.update-components-actor__meta .update-components-actor__title'
  ],

  authorHeadline: [
    '.update-components-actor__description',
    '.feed-shared-actor__sub-description',
    '.actor-description',
    '.update-components-actor__headline',
    '.update-components-actor__sub-description span[aria-hidden="true"]'
  ],

  // Main post text content selectors
  postText: [
    '.update-components-text',
    '.feed-shared-update-v2__commentary',
    '.feed-shared-text',
    'span.break-words',
    '.update-components-article__description',
    'div[data-test-id="main-feed-activity-card"] .update-components-text'
  ],

  // Hashtags within post
  hashtags: [
    'a[href*="/hashtag/"]',
    'a.aria-text-hashtag'
  ],

  // Native comment action bar / button area where AI toolbar will be injected
  commentBoxActionBar: [
    '.comments-comment-box__form-container',
    '.comments-comment-box__editor-container',
    '.comments-comment-box',
    '.display-flex.flex-grow-1',
    '.comments-comment-box__form'
  ]
};

// Helper: Query first matching selector from an array
function querySelectorFallback(parent, selectorArray) {
  if (!parent) return null;
  for (const selector of selectorArray) {
    const element = parent.querySelector(selector);
    if (element) return element;
  }
  return null;
}

// Helper: Query all matching elements from an array
function querySelectorAllFallback(parent, selectorArray) {
  if (!parent) return [];
  const results = [];
  for (const selector of selectorArray) {
    const elements = parent.querySelectorAll(selector);
    elements.forEach(el => results.push(el));
  }
  return results;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LINKEDIN_SELECTORS, querySelectorFallback, querySelectorAllFallback };
}
