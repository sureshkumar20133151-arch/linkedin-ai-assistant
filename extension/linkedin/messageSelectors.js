/**
 * LinkedIn Messaging (DM inbox) Selector Module
 *
 * NOTE: LinkedIn's messaging UI (both the mini overlay chat bubbles and the
 * full /messaging page) changes its internal class names over time, and
 * these have not been verified against a live LinkedIn session during this
 * change. They are best-effort primary selectors ranked by how commonly
 * they've been documented, backed by generic contenteditable/role fallbacks
 * so detection degrades gracefully instead of breaking outright.
 *
 * If message detection stops working, this is the ONLY file that should
 * need updating — open DevTools on an actual LinkedIn conversation, inspect
 * the compose box / recipient name / message bubbles, and add the real
 * class names to the top of the relevant array below.
 */

const LINKEDIN_MESSAGE_SELECTORS = {
  // The actual text input box for composing a DM (overlay mini-chat AND full messaging page)
  composeEditors: [
    '.msg-form__contenteditable[contenteditable="true"]',
    '.msg-form__message-texteditor div[contenteditable="true"]',
    'div.msg-form__contenteditable',
    '.msg-form div[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]'
  ],

  // Container that wraps one whole conversation panel (overlay bubble OR full-page thread)
  conversationContainers: [
    '.msg-overlay-conversation-bubble',
    '.msg-convo-wrapper',
    '.msg-overlay-bubble-header',
    '.scaffold-layout__detail',
    '.msg-form'
  ],

  // Recipient display name near the top of a conversation
  recipientName: [
    '.msg-overlay-bubble-header__title',
    '.msg-entity-lockup__entity-title',
    '.artdeco-entity-lockup__title',
    'h2.msg-entity-lockup__entity-title',
    '.msg-title-bar__title',
    '.msg-thread__link-to-profile'
  ],

  // Recipient headline/subtitle (role, company) if shown
  recipientHeadline: [
    '.msg-entity-lockup__entity-info',
    '.artdeco-entity-lockup__subtitle'
  ],

  // Individual message bubbles inside the thread
  messageBubbles: [
    '.msg-s-event-listitem',
    'li.msg-s-message-list__event',
    '.msg-s-message-list__event'
  ],

  // Text content inside a message bubble
  messageBubbleText: [
    '.msg-s-event-listitem__body',
    '.msg-s-event-listitem__message-bubble'
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LINKEDIN_MESSAGE_SELECTORS };
}
