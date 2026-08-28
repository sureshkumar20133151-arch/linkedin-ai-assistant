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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setToolbarLoadingState, showToolbarNotice, renderToolbarResultCards };
}
