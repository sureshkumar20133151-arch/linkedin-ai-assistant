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

// Renders a clear Generated Comment card inside the extension UI
function renderGeneratedCommentCard(container, commentText, autoInserted = false, postContext = null, composer = null) {
  if (!commentText || !commentText.trim()) return;

  const card = document.createElement('div');
  card.className = 'linkedin-ai-dm-pitch-card linkedin-ai-comment-card';
  card.style.background = 'linear-gradient(135deg, #f4fbf7 0%, #e6f7ef 100%)';
  card.style.borderColor = '#057642';

  const isConnected = postContext?.isConnected;
  const authorName = postContext?.authorName || 'Author';

  let dmButtonHtml = '';
  if (postContext && postContext.authorName && postContext.authorName !== 'LinkedIn User') {
    if (isConnected) {
      dmButtonHtml = `
        <button type="button" class="linkedin-ai-direct-dm-btn" style="background: linear-gradient(135deg, #0a66c2 0%, #0855a3 100%); color: #ffffff; border: none; border-radius: 16px; padding: 5px 14px; font-size: 11.5px; font-weight: 600; cursor: pointer; transition: all 0.15s ease;">
          💬 DM ${escapeHtml(authorName)}
        </button>
      `;
    } else {
      dmButtonHtml = `
        <button type="button" disabled title="Direct messaging is only available for 1st-degree connections on LinkedIn" style="background: #f1f5f9; color: #94a3b8; border: 1px solid #cbd5e1; border-radius: 16px; padding: 5px 12px; font-size: 11px; font-weight: 500; cursor: not-allowed;">
          🔒 Not Connected (1st degree required)
        </button>
      `;
    }
  }

  card.innerHTML = `
    <div class="linkedin-ai-dm-header">
      <span class="linkedin-ai-dm-badge" style="background: #057642;">💬 GENERATED COMMENT</span>
      <span style="font-size: 11px; color: #057642; font-weight: 600;">
        ${autoInserted ? '✓ Inserted in Comment Box' : 'Ready to Copy'}
      </span>
    </div>
    <div class="linkedin-ai-dm-text" style="border-color: rgba(5, 118, 66, 0.2);"></div>
    <div class="linkedin-ai-dm-actions">
      <button type="button" class="linkedin-ai-copy-dm-btn" style="color: #057642; border-color: #057642;">📋 Copy Comment</button>
      ${dmButtonHtml}
    </div>
  `;

  card.querySelector('.linkedin-ai-dm-text').textContent = commentText.trim();

  const copyBtn = card.querySelector('.linkedin-ai-copy-dm-btn');
  copyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const copied = await copyCommentToClipboard(commentText.trim());
    copyBtn.textContent = copied ? 'Comment Copied! ✓' : 'Copy Failed';
    setTimeout(() => { copyBtn.textContent = '📋 Copy Comment'; }, 2000);
  });

  const directDmBtn = card.querySelector('.linkedin-ai-direct-dm-btn');
  if (directDmBtn) {
    directDmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const postContainer = composer
        ? (composer.closest('div.feed-shared-update-v2, article, li.reusable-search__result-container, div.entity-result, div[data-urn]') || composer.parentElement)
        : null;
      const { messageBtn, authorLink } = resolvePostAuthorTargets(postContainer);

      if (messageBtn) {
        messageBtn.click();
      } else if (postContext?.authorProfileUrl) {
        window.open(postContext.authorProfileUrl, '_blank');
      } else if (authorLink && authorLink.href) {
        window.open(authorLink.href, '_blank');
      } else {
        window.open('https://www.linkedin.com/messaging/', '_blank');
      }
    });
  }

  container.appendChild(card);
}

// Renders the full Outreach Agent result for hiring/opportunity posts
function renderOutreachCard(container, outreachData, postContext = null, composer = null, autoInserted = false) {
  if (!outreachData) return;

  const card = document.createElement('div');
  card.className = 'linkedin-ai-outreach-container';

  const authorName = postContext?.authorName || 'Author';
  const isConnected = postContext?.isConnected;
  const analysis = outreachData.analysis || {};
  const dms = outreachData.dm || {};
  const commentText = outreachData.comment || '';

  // DM styles available
  const dmStyles = [
    { id: 'professional', label: '👔 Professional', text: dms.professional || '' },
    { id: 'friendly',     label: '😊 Friendly',     text: dms.friendly || '' },
    { id: 'technical',    label: '🔧 Technical',    text: dms.technical || '' },
    { id: 'valuefirst',   label: '💡 Value-First',  text: dms.valuefirst || '' }
  ].filter(s => s.text);

  let activeDmStyle = dmStyles[0]?.id || 'professional';
  let activeDmText = dmStyles[0]?.text || '';

  let directDmBtnHtml = '';
  if (isConnected) {
    directDmBtnHtml = `
      <button type="button" class="linkedin-ai-outreach-dm-open-btn" style="background: linear-gradient(135deg, #0a66c2 0%, #0855a3 100%); color: #fff; border: none; border-radius: 16px; padding: 6px 14px; font-size: 11.5px; font-weight: 600; cursor: pointer;">
        💬 DM ${escapeHtml(authorName)}
      </button>
    `;
  } else {
    directDmBtnHtml = `
      <button type="button" disabled title="Direct messaging is only available for 1st-degree connections on LinkedIn" style="background: #f1f5f9; color: #94a3b8; border: 1px solid #cbd5e1; border-radius: 16px; padding: 5px 12px; font-size: 11px; font-weight: 500; cursor: not-allowed;">
        🔒 Not Connected (1st degree required)
      </button>
    `;
  }

  card.innerHTML = `
    <!-- Main Badge Header -->
    <div class="linkedin-ai-outreach-header">
      <div class="linkedin-ai-outreach-title">
        <span class="linkedin-ai-outreach-badge">🎯 OPPORTUNITY OUTREACH AGENT</span>
        <span class="linkedin-ai-outreach-pill">${escapeHtml(analysis.projectType || 'Project')}</span>
        <span class="linkedin-ai-outreach-pill hiring">${escapeHtml(analysis.hiringType || 'Hiring')}</span>
      </div>
    </div>

    <!-- Opportunity Analysis Box -->
    <div class="linkedin-ai-outreach-analysis">
      <div class="linkedin-ai-outreach-analysis-title">🔍 Opportunity Breakdown</div>
      <div class="linkedin-ai-outreach-analysis-grid">
        <div><strong>Business Goal:</strong> ${escapeHtml(analysis.businessGoal || 'Business Growth & Leads')}</div>
        <div><strong>Hidden Need:</strong> ${escapeHtml(analysis.hiddenPain || 'Reliable execution & scalable system')}</div>
        <div style="grid-column: span 2;"><strong>Suggested Solution:</strong> ${escapeHtml(analysis.suggestedSolution || 'Build a scalable solution aligned with their business goal.')}</div>
      </div>
    </div>

    <!-- Public Comment Section -->
    <div class="linkedin-ai-outreach-section">
      <div class="linkedin-ai-outreach-section-title">
        <span>💬 Value-First Public Comment</span>
        <span class="linkedin-ai-outreach-status">${autoInserted ? '✓ Inserted in Box' : 'Ready to Post'}</span>
      </div>
      <div class="linkedin-ai-outreach-comment-box">${escapeHtml(commentText)}</div>
      <div class="linkedin-ai-outreach-actions">
        <button type="button" class="linkedin-ai-outreach-copy-comment-btn">📋 Copy Comment</button>
      </div>
    </div>

    <!-- Connection Request Note Section -->
    ${outreachData.connectionNote ? `
      <div class="linkedin-ai-outreach-section connection-section">
        <div class="linkedin-ai-outreach-section-title">
          <span>🤝 Connection Request Note (No Selling)</span>
          <span class="linkedin-ai-outreach-char-count">${outreachData.connectionNote.length} / 280 chars</span>
        </div>
        <div class="linkedin-ai-outreach-connection-box">${escapeHtml(outreachData.connectionNote)}</div>
        <div class="linkedin-ai-outreach-actions">
          <button type="button" class="linkedin-ai-outreach-copy-connection-btn">📋 Copy Connection Note</button>
        </div>
      </div>
    ` : ''}

    <!-- 4 DM Styles Section -->
    <div class="linkedin-ai-outreach-section dm-section">
      <div class="linkedin-ai-outreach-section-title">
        <span>📨 Personalized 1:1 Direct Message</span>
        <span style="font-size: 11px; color: #64748b;">Select Style:</span>
      </div>

      <!-- DM Style Switcher Pills -->
      <div class="linkedin-ai-outreach-dm-tabs">
        ${dmStyles.map((s, idx) => `
          <button type="button" class="linkedin-ai-outreach-tab-btn ${idx === 0 ? 'active' : ''}" data-style="${s.id}">
            ${s.label}
          </button>
        `).join('')}
      </div>

      <div class="linkedin-ai-outreach-dm-box">${escapeHtml(activeDmText)}</div>

      <div class="linkedin-ai-outreach-actions">
        <button type="button" class="linkedin-ai-outreach-copy-dm-btn">📋 Copy DM</button>
        ${directDmBtnHtml}
      </div>
    </div>

    <!-- Follow-up Sequences (Collapsible) -->
    ${(outreachData.followup1 || outreachData.followup2) ? `
      <details class="linkedin-ai-outreach-followups">
        <summary>⏰ Follow-Up Sequence (If No Reply)</summary>
        <div class="linkedin-ai-outreach-followup-content">
          ${outreachData.followup1 ? `
            <div class="linkedin-ai-outreach-followup-item">
              <div class="linkedin-ai-outreach-followup-label">
                <span>Follow-up 1 (After 3 days)</span>
                <button type="button" class="linkedin-ai-copy-followup-btn" data-text="${escapeHtml(outreachData.followup1)}">📋 Copy</button>
              </div>
              <div class="linkedin-ai-outreach-followup-text">${escapeHtml(outreachData.followup1)}</div>
            </div>
          ` : ''}

          ${outreachData.followup2 ? `
            <div class="linkedin-ai-outreach-followup-item">
              <div class="linkedin-ai-outreach-followup-label">
                <span>Follow-up 2 (After 7 days)</span>
                <button type="button" class="linkedin-ai-copy-followup-btn" data-text="${escapeHtml(outreachData.followup2)}">📋 Copy</button>
              </div>
              <div class="linkedin-ai-outreach-followup-text">${escapeHtml(outreachData.followup2)}</div>
            </div>
          ` : ''}
        </div>
      </details>
    ` : ''}

    <!-- Strategic Tactical Tip -->
    ${outreachData.tip ? `
      <div class="linkedin-ai-outreach-tip">
        <span class="linkedin-ai-outreach-tip-icon">💡</span>
        <span><strong>Strategic Tip:</strong> ${escapeHtml(outreachData.tip)}</span>
      </div>
    ` : ''}
  `;

  // --- Attach Event Handlers ---
  const commentCopyBtn = card.querySelector('.linkedin-ai-outreach-copy-comment-btn');
  commentCopyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const copied = await copyCommentToClipboard(commentText);
    commentCopyBtn.textContent = copied ? 'Comment Copied! ✓' : 'Copy Failed';
    setTimeout(() => { commentCopyBtn.textContent = '📋 Copy Comment'; }, 2000);
  });

  const connectionCopyBtn = card.querySelector('.linkedin-ai-outreach-copy-connection-btn');
  if (connectionCopyBtn && outreachData.connectionNote) {
    connectionCopyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const copied = await copyCommentToClipboard(outreachData.connectionNote);
      connectionCopyBtn.textContent = copied ? 'Note Copied! ✓' : 'Copy Failed';
      setTimeout(() => { connectionCopyBtn.textContent = '📋 Copy Connection Note'; }, 2000);
    });
  }

  const dmBox = card.querySelector('.linkedin-ai-outreach-dm-box');
  const dmCopyBtn = card.querySelector('.linkedin-ai-outreach-copy-dm-btn');
  const tabBtns = card.querySelectorAll('.linkedin-ai-outreach-tab-btn');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const styleId = btn.getAttribute('data-style');
      const match = dmStyles.find(s => s.id === styleId);
      if (match) {
        activeDmText = match.text;
        dmBox.textContent = match.text;
      }
    });
  });

  dmCopyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const copied = await copyCommentToClipboard(activeDmText);
    dmCopyBtn.textContent = copied ? 'DM Copied! ✓' : 'Copy Failed';
    setTimeout(() => { dmCopyBtn.textContent = '📋 Copy DM'; }, 2000);
  });

  const dmOpenBtn = card.querySelector('.linkedin-ai-outreach-dm-open-btn');
  if (dmOpenBtn) {
    dmOpenBtn.addEventListener('click', (e) => {
      e.preventDefault();
      copyCommentToClipboard(activeDmText);
      const postContainer = composer
        ? (composer.closest('div.feed-shared-update-v2, article, li.reusable-search__result-container, div.entity-result, div[data-urn]') || composer.parentElement)
        : null;
      const { messageBtn, authorLink } = resolvePostAuthorTargets(postContainer);

      if (messageBtn) {
        messageBtn.click();
      } else if (postContext?.authorProfileUrl) {
        window.open(postContext.authorProfileUrl, '_blank');
      } else if (authorLink && authorLink.href) {
        window.open(authorLink.href, '_blank');
      } else {
        window.open('https://www.linkedin.com/messaging/', '_blank');
      }
    });
  }

  // Follow-up copy buttons
  const followupCopyBtns = card.querySelectorAll('.linkedin-ai-copy-followup-btn');
  followupCopyBtns.forEach(b => {
    b.addEventListener('click', async (e) => {
      e.preventDefault();
      const text = b.getAttribute('data-text');
      const copied = await copyCommentToClipboard(text);
      b.textContent = copied ? 'Copied! ✓' : 'Failed';
      setTimeout(() => { b.textContent = '📋 Copy'; }, 2000);
    });
  });

  container.appendChild(card);
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setToolbarLoadingState, showToolbarNotice, renderToolbarResultCards, renderDMPitchCard, renderGeneratedCommentCard, renderOutreachCard, resolvePostAuthorTargets };
}

