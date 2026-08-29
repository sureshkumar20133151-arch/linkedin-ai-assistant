/**
 * Shared Toolbar UI Helpers
 * Used by both content.js (feed/post comments) and messaging.js (DM inbox)
 * so the loading state, notice banner, and multi-result card rendering
 * logic isn't duplicated across the two features.
 */

// Toggle loading state across a group of buttons; only the clicked button
// gets a spinner + custom label, the rest are just disabled.
function setToolbarLoadingState(buttons, activeBtn, isLoading, loadingLabel = 'Generating...') {
  buttons.forEach(b => {
    b.disabled = isLoading;
  });

  if (isLoading) {
    activeBtn.setAttribute('data-original-text', activeBtn.innerText);
    activeBtn.innerHTML = `<span class="linkedin-ai-spinner"></span> ${loadingLabel}`;
  } else {
    buttons.forEach(b => {
      const orig = b.getAttribute('data-original-text');
      if (orig) b.innerText = orig;
    });
  }
}

// Status notice banner (info / warning / error), with an optional Copy
// fallback button when automatic insertion into the LinkedIn editor fails.
function showToolbarNotice(container, type, message, copyText = null) {
  container.innerHTML = '';
  const notice = document.createElement('div');
  notice.className = `linkedin-ai-notice ${type}`;

  let content = `<span>${message}</span>`;
  if (copyText) {
    content += `<button type="button" class="linkedin-ai-copy-btn">Copy Text</button>`;
  }
  notice.innerHTML = content;

  if (copyText) {
    const copyBtn = notice.querySelector('.linkedin-ai-copy-btn');
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const copied = await copyCommentToClipboard(copyText);
      copyBtn.innerText = copied ? 'Copied! ✓' : 'Copy Failed';
    });
  }

  container.appendChild(notice);

  if (type === 'info') {
    setTimeout(() => {
      if (notice.parentElement) notice.remove();
    }, 6000);
  }
}

// Renders up to 3 generated variants (professional/insightful/short) as
// comparison cards. `insertFn(text)` is caller-supplied so this file has no
// knowledge of whether it's inserting into a comment box or a DM editor —
// it must return a Promise resolving to { success: boolean }.
function renderToolbarResultCards(container, variants, insertFn, noticeContainer) {
  container.innerHTML = '';

  const labels = { professional: 'Professional', insightful: 'Insightful', short: 'Short' };
  const order = ['professional', 'insightful', 'short'];

  order.forEach(key => {
    const text = (variants[key] || '').trim();
    if (!text) return;

    const card = document.createElement('div');
    card.className = 'linkedin-ai-result-card';
    card.innerHTML = `
      <div class="linkedin-ai-result-label">${labels[key]}</div>
      <div class="linkedin-ai-result-text"></div>
      <div class="linkedin-ai-result-actions">
        <button type="button" class="linkedin-ai-result-insert-btn">Use this</button>
        <button type="button" class="linkedin-ai-result-copy-btn">Copy</button>
      </div>
    `;
    // Set via textContent to avoid any HTML injection from AI output
    card.querySelector('.linkedin-ai-result-text').textContent = text;

    const insertBtn = card.querySelector('.linkedin-ai-result-insert-btn');
    const copyBtn = card.querySelector('.linkedin-ai-result-copy-btn');

    insertBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      insertBtn.disabled = true;
      insertBtn.textContent = 'Inserting...';

      const insertResult = await insertFn(text);

      if (insertResult && insertResult.success) {
        showToolbarNotice(noticeContainer, 'info', `${labels[key]} inserted! Review before sending/posting.`);
        container.innerHTML = '';
      } else {
        showToolbarNotice(noticeContainer, 'warning', `Couldn't insert automatically.`, text);
        insertBtn.disabled = false;
        insertBtn.textContent = 'Use this';
      }
    });

    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const copied = await copyCommentToClipboard(text);
      copyBtn.textContent = copied ? 'Copied! ✓' : 'Copy Failed';
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
    });

    container.appendChild(card);
  });

  if (!container.children.length) {
    showToolbarNotice(noticeContainer, 'error', 'The assistant did not return any usable results. Try again.');
  }
}

// Resolves the safest "Message" button and author profile link for a post,
// scoped as narrowly as possible to avoid two real risks:
//   1. Matching the wrong control — LinkedIn reuses generic classes like
//      ".entry-point" across Like/Repost/Send buttons, so we only match by
//      an aria-label that actually STARTS WITH "Message" (word boundary),
//      never a loose class-name guess.
//   2. Matching the wrong person — a post container also contains the
//      comments section below it, which has its own commenter profile
//      links. We prefer a narrow "header/actor" scope first, and always
//      exclude anything nested inside a comments area.
function resolvePostAuthorTargets(postContainer) {
  if (!postContainer) return { messageBtn: null, authorLink: null };

  const headerScope =
    postContainer.querySelector('.update-components-actor, [data-view-name="feed-actor"], .feed-shared-actor') ||
    postContainer;

  const isInsideComments = (el) => !!el.closest('[class*="comment"]');

  const messageBtn = Array.from(headerScope.querySelectorAll('button[aria-label]'))
    .find(b => /^message\b/i.test((b.getAttribute('aria-label') || '').trim()) && !isInsideComments(b)) || null;

  const authorLink = Array.from(headerScope.querySelectorAll('a[href*="/in/"]'))
    .find(a => !isInsideComments(a)) || null;

  return { messageBtn, authorLink };
}

// Renders a specialized DM Pitch card for hiring/lead posts, allowing 1-click
// copying of a tailored 1:1 message and auto-opening the author's DM/profile.
function renderDMPitchCard(container, dmPitch, authorName, composer) {
  if (!dmPitch || !dmPitch.trim()) return;

  const card = document.createElement('div');
  card.className = 'linkedin-ai-dm-pitch-card';
  card.innerHTML = `
    <div class="linkedin-ai-dm-header">
      <span class="linkedin-ai-dm-badge">📩 READY DM PITCH</span>
      <span>For <strong>${escapeHtml(authorName || 'Author')}</strong></span>
    </div>
    <div class="linkedin-ai-dm-text"></div>
    <div class="linkedin-ai-dm-actions">
      <button type="button" class="linkedin-ai-copy-dm-btn">📋 Copy DM Pitch</button>
      <button type="button" class="linkedin-ai-open-dm-btn">🚀 Open DM Window</button>
    </div>
  `;

  card.querySelector('.linkedin-ai-dm-text').textContent = dmPitch.trim();

  const copyBtn = card.querySelector('.linkedin-ai-copy-dm-btn');
  const openBtn = card.querySelector('.linkedin-ai-open-dm-btn');

  copyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const copied = await copyCommentToClipboard(dmPitch.trim());
    copyBtn.textContent = copied ? 'Copied Pitch! ✓' : 'Copy Failed';
    setTimeout(() => { copyBtn.textContent = '📋 Copy DM Pitch'; }, 2000);
  });

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openBtn.textContent = 'Opening DM...';

    // IMPORTANT: resolve targets and open the window/click the button
    // SYNCHRONOUSLY, still inside this trusted click handler — before any
    // `await`. Calling window.open() after an awaited clipboard write can
    // silently get blocked by Chrome's popup blocker since the browser's
    // "user activation" window can expire during the await.
    const postContainer = composer
      ? (composer.closest('div.feed-shared-update-v2, article, li.reusable-search__result-container, div.entity-result, div[data-urn]') || composer.parentElement)
      : null;
    const { messageBtn, authorLink } = resolvePostAuthorTargets(postContainer);

    let opened = false;
    if (messageBtn) {
      messageBtn.click();
      opened = true;
    } else if (authorLink && authorLink.href) {
      window.open(authorLink.href, '_blank');
      opened = true;
    }
    if (!opened) {
      window.open('https://www.linkedin.com/messaging/', '_blank');
    }

    // Clipboard write can safely happen after — it doesn't rely on the
    // same user-activation window that window.open() needs.
    copyCommentToClipboard(dmPitch.trim()).then(() => {
      openBtn.textContent = 'Pitch Copied & DM Opened! ✓';
      setTimeout(() => { openBtn.textContent = '🚀 Open DM Window'; }, 2500);
    });
  });

  container.appendChild(card);
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setToolbarLoadingState, showToolbarNotice, renderToolbarResultCards, renderDMPitchCard, resolvePostAuthorTargets };
}

