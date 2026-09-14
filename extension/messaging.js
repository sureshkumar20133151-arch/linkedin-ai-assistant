/**
 * Personal LinkedIn AI Assistant - Messaging (DM Inbox) Content Script
 * v2.0 — Complete UI/UX redesign with Auto Reply, Instruction Override & Smart Labels
 */

(function () {
  console.log('[AI Assistant] LinkedIn Messaging v2.0 Initialized.');

  // DEFAULT_PERSONA is defined in shared/config.js (loaded first via manifest.json)

  async function getStoredSettings() {
    return new Promise(resolve => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(['persona', 'assistantBehavior'], result => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
              resolve({ persona: DEFAULT_PERSONA, behavior: {} });
              return;
            }
            resolve({
              persona: result?.persona || DEFAULT_PERSONA,
              behavior: result?.assistantBehavior || {}
            });
          });
        } else {
          resolve({ persona: DEFAULT_PERSONA, behavior: {} });
        }
      } catch (e) {
        resolve({ persona: DEFAULT_PERSONA, behavior: {} });
      }
    });
  }

  async function gatherMessageContextOrThrow(composer) {
    const { recipient, conversation } = await extractMessageContext(composer);
    if (!recipient.name && (!conversation.messages || conversation.messages.length === 0)) {
      throw new Error('Could not detect who you\'re messaging. Make sure the conversation is fully loaded, then try again.');
    }
    return { recipient, conversation };
  }

  // Detect message intent from last incoming message
  function detectMessageType(conversation) {
    if (!conversation?.messages?.length) return 'outreach';
    const incoming = conversation.messages.filter(m => m.sender === 'them');
    if (!incoming.length) return 'outreach';

    const lastMsg = (incoming[incoming.length - 1]?.text || '').toLowerCase();

    if (
      lastMsg.includes('thank you for connecting') ||
      lastMsg.includes('thanks for connecting') ||
      lastMsg.includes('pleasure to connect') ||
      lastMsg.includes('glad to connect')
    ) return 'connection';

    if (
      lastMsg.includes('can you build') ||
      lastMsg.includes('do you build') ||
      lastMsg.includes('website') ||
      lastMsg.includes('project') ||
      lastMsg.includes('budget') ||
      lastMsg.includes('how much') ||
      lastMsg.includes('quote') ||
      lastMsg.includes('price') ||
      lastMsg.includes('rates') ||
      lastMsg.includes('available for')
    ) return 'project';

    if (
      lastMsg.includes('sales') ||
      lastMsg.includes('our service') ||
      lastMsg.includes('our product') ||
      lastMsg.includes('we offer') ||
      lastMsg.includes('interested in') ||
      lastMsg.includes('lead generation') ||
      lastMsg.includes('marketing') ||
      lastMsg.includes('seo') ||
      lastMsg.includes('growth') ||
      lastMsg.includes('book a call') ||
      lastMsg.includes('schedule a call') ||
      lastMsg.includes('discovery call')
    ) return 'sales';

    if (
      lastMsg.includes('looking for work') ||
      lastMsg.includes('actively seeking') ||
      lastMsg.includes('seeking opportunities') ||
      lastMsg.includes('open to work') ||
      lastMsg.includes('fresher') ||
      lastMsg.includes('internship') ||
      lastMsg.includes('hire me')
    ) return 'job-seeker';

    return 'reply';
  }

  const TYPE_META = {
    'connection':  { label: '🤝 Connection Thanks', color: '#16a34a', bg: '#f0fdf4', hint: 'Thank them warmly & briefly introduce your work.' },
    'project':     { label: '💼 Project Enquiry',   color: '#0a66c2', bg: '#eff6ff', hint: 'Ask qualifying questions + share portfolio.' },
    'sales':       { label: '📢 Sales / Promotion',  color: '#9333ea', bg: '#faf5ff', hint: 'Decline politely or ask for more info.' },
    'job-seeker':  { label: '🎓 Job Seeker',         color: '#d97706', bg: '#fffbeb', hint: 'Encourage & redirect professionally.' },
    'reply':       { label: '💬 Reply',              color: '#0a66c2', bg: '#eff6ff', hint: 'Context-aware reply based on conversation.' },
    'outreach':    { label: '📨 Cold Outreach',      color: '#64748b', bg: '#f8fafc', hint: 'First message to this person.' },
  };

  // Quick-action instruction presets per message type
  const QUICK_ACTIONS = {
    'connection':  ['Thank warmly', 'Introduce my work briefly', 'Keep it short & friendly'],
    'project':     ['Ask about budget & timeline', 'Share portfolio & availability', 'Ask clarifying questions'],
    'sales':       ['Politely decline, not interested now', 'Ask for more details first', 'Not needed, will contact if required'],
    'job-seeker':  ['Encourage & wish them luck', 'Redirect professionally', 'Short warm response'],
    'reply':       ['Professional reply', 'Short & direct', 'Ask a follow-up question'],
    'outreach':    ['Professional intro', 'Short friendly opener', 'Value-first approach'],
  };

  function injectMessageToolbar(composer) {
    if (!composer || composer.getAttribute('data-ai-assistant-msg-toolbar')) return;
    composer.setAttribute('data-ai-assistant-msg-toolbar', 'true');

    if (composer.parentElement && composer.parentElement.querySelector('.linkedin-ai-msg-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'linkedin-ai-msg-toolbar';
    toolbar.innerHTML = `
      <!-- Collapsed Pill -->
      <button type="button" class="linkedin-ai-msg-pill" hidden title="Open AI Message Assistant">
        <span>✨</span> AI Reply
      </button>

      <!-- Main Body -->
      <div class="linkedin-ai-msg-body">
        <!-- Header -->
        <div class="linkedin-ai-msg-header">
          <div class="linkedin-ai-msg-title">
            <span class="linkedin-ai-msg-sparkle">✨</span>
            AI Message Assistant
          </div>
          <div class="linkedin-ai-msg-header-right">
            <div class="linkedin-ai-msg-type-badge" hidden></div>
            <button type="button" class="linkedin-ai-msg-close" title="Minimize">✕</button>
          </div>
        </div>

        <!-- Context Hint -->
        <div class="linkedin-ai-msg-hint" hidden></div>

        <!-- Quick Action Chips -->
        <div class="linkedin-ai-msg-chips" hidden></div>

        <!-- Instruction Input -->
        <div class="linkedin-ai-msg-input-row">
          <input type="text" class="linkedin-ai-msg-input"
            placeholder="Instruction (e.g. 'decline politely', 'ask about budget')..." />
        </div>

        <!-- Action Buttons -->
        <div class="linkedin-ai-msg-actions">
          <button type="button" class="linkedin-ai-msg-auto-btn" title="Auto-generate the best reply (Ctrl+Shift+M)">
            ⚡ Auto Reply
          </button>
          <div class="linkedin-ai-msg-style-btns">
            <button type="button" class="linkedin-ai-msg-style-btn" data-style="professional">Professional</button>
            <button type="button" class="linkedin-ai-msg-style-btn" data-style="insightful">Insightful</button>
            <button type="button" class="linkedin-ai-msg-style-btn" data-style="short">Short</button>
          </div>
          <button type="button" class="linkedin-ai-msg-all-btn" data-style="all">✨ All 3</button>
        </div>

        <!-- Results -->
        <div class="linkedin-ai-msg-results"></div>
        <div class="linkedin-ai-msg-notice"></div>
      </div>
    `;

    if (composer.parentNode) {
      composer.parentNode.insertBefore(toolbar, composer);
    } else {
      composer.appendChild(toolbar);
    }

    // --- Element refs ---
    const pillBtn        = toolbar.querySelector('.linkedin-ai-msg-pill');
    const mainBody       = toolbar.querySelector('.linkedin-ai-msg-body');
    const closeBtn       = toolbar.querySelector('.linkedin-ai-msg-close');
    const typeBadge      = toolbar.querySelector('.linkedin-ai-msg-type-badge');
    const hintEl         = toolbar.querySelector('.linkedin-ai-msg-hint');
    const chipsEl        = toolbar.querySelector('.linkedin-ai-msg-chips');
    const inputEl        = toolbar.querySelector('.linkedin-ai-msg-input');
    const autoBtn        = toolbar.querySelector('.linkedin-ai-msg-auto-btn');
    const styleBtns      = toolbar.querySelectorAll('.linkedin-ai-msg-style-btn');
    const allBtn         = toolbar.querySelector('.linkedin-ai-msg-all-btn');
    const resultsEl      = toolbar.querySelector('.linkedin-ai-msg-results');
    const noticeEl       = toolbar.querySelector('.linkedin-ai-msg-notice');

    const allInteractive = [autoBtn, allBtn, ...styleBtns];
    let detectedType = 'reply';

    // --- Collapse / Expand ---
    closeBtn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      mainBody.hidden = true;
      pillBtn.hidden = false;
      toolbar.classList.add('collapsed');
    });

    pillBtn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      pillBtn.hidden = true;
      mainBody.hidden = false;
      toolbar.classList.remove('collapsed');
      initContext();
    });

    // --- Detect context & show type badge ---
    async function initContext() {
      try {
        const { conversation } = await gatherMessageContextOrThrow(composer);
        detectedType = detectMessageType(conversation);
        const meta = TYPE_META[detectedType] || TYPE_META['reply'];

        // Type Badge
        typeBadge.textContent = meta.label;
        typeBadge.style.background = meta.bg;
        typeBadge.style.color = meta.color;
        typeBadge.style.border = `1px solid ${meta.color}30`;
        typeBadge.hidden = false;

        // Hint
        hintEl.textContent = `💡 ${meta.hint}`;
        hintEl.style.color = meta.color;
        hintEl.hidden = false;

        // Quick Action Chips
        const actions = QUICK_ACTIONS[detectedType] || [];
        chipsEl.innerHTML = '';
        actions.forEach(action => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'linkedin-ai-msg-chip';
          chip.textContent = action;
          chip.style.borderColor = meta.color + '50';
          chip.style.color = meta.color;
          chip.addEventListener('click', () => {
            inputEl.value = action;
            inputEl.focus();
            chip.style.background = meta.color;
            chip.style.color = '#fff';
            setTimeout(() => { chip.style.background = ''; chip.style.color = meta.color; }, 800);
          });
          chipsEl.appendChild(chip);
        });
        chipsEl.hidden = false;
      } catch (e) {
        // Non-blocking
      }
    }

    // Init on load
    setTimeout(initContext, 600);

    // --- Show/Hide loading state ---
    function setLoading(active, btn = autoBtn, label = 'Generating...') {
      allInteractive.forEach(b => { b.disabled = active; b.style.opacity = active ? '0.55' : ''; });
      if (active) {
        btn._origHTML = btn.innerHTML;
        btn.innerHTML = `<span class="linkedin-ai-msg-spinner"></span> ${label}`;
      } else if (btn._origHTML) {
        btn.innerHTML = btn._origHTML;
        delete btn._origHTML;
      }
    }

    function showNotice(type, text) {
      noticeEl.className = `linkedin-ai-msg-notice ${type}`;
      noticeEl.textContent = text;
      noticeEl.hidden = false;
    }

    function clearNotice() {
      noticeEl.hidden = true;
      noticeEl.textContent = '';
    }

    // --- Render Result Cards ---
    function renderSingleResult(message) {
      resultsEl.innerHTML = '';
      const card = document.createElement('div');
      card.className = 'linkedin-ai-msg-result-card';
      card.innerHTML = `
        <div class="linkedin-ai-msg-result-text">${escapeHtml(message)}</div>
        <div class="linkedin-ai-msg-result-actions">
          <button type="button" class="linkedin-ai-msg-insert-btn">✅ Insert</button>
          <button type="button" class="linkedin-ai-msg-copy-btn">📋 Copy</button>
        </div>
      `;
      card.querySelector('.linkedin-ai-msg-insert-btn').addEventListener('click', async () => {
        const r = await insertCommentIntoEditor(composer, message);
        showNotice('success', r.success ? 'Message inserted! Click Send when ready.' : 'Copied — paste manually.');
      });
      card.querySelector('.linkedin-ai-msg-copy-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(message).then(() => showNotice('success', 'Copied to clipboard!'));
      });
      resultsEl.appendChild(card);
    }

    function renderAllResults(messages) {
      resultsEl.innerHTML = '';
      const labels = { professional: '👔 Professional', insightful: '💡 Insightful', short: '⚡ Short' };
      Object.entries(messages).forEach(([style, text]) => {
        if (!text) return;
        const card = document.createElement('div');
        card.className = 'linkedin-ai-msg-result-card';
        card.innerHTML = `
          <div class="linkedin-ai-msg-result-label">${labels[style] || style}</div>
          <div class="linkedin-ai-msg-result-text">${escapeHtml(text)}</div>
          <div class="linkedin-ai-msg-result-actions">
            <button type="button" class="linkedin-ai-msg-insert-btn">✅ Insert</button>
            <button type="button" class="linkedin-ai-msg-copy-btn">📋 Copy</button>
          </div>
        `;
        card.querySelector('.linkedin-ai-msg-insert-btn').addEventListener('click', async () => {
          const r = await insertCommentIntoEditor(composer, text);
          showNotice('success', r.success ? 'Message inserted! Click Send when ready.' : 'Copied — paste manually.');
        });
        card.querySelector('.linkedin-ai-msg-copy-btn').addEventListener('click', () => {
          navigator.clipboard.writeText(text).then(() => showNotice('success', 'Copied!'));
        });
        resultsEl.appendChild(card);
      });
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // --- Auto Reply ---
    async function runAutoReply() {
      clearNotice();
      resultsEl.innerHTML = '';
      setLoading(true, autoBtn, 'Auto Replying...');
      try {
        const { recipient, conversation } = await gatherMessageContextOrThrow(composer);
        const { persona, behavior } = await getStoredSettings();
        const oneTimeInstruction = inputEl.value.trim() || null;

        const response = await requestGenerateMessage({
          recipient, conversation, persona, behavior,
          style: 'professional',
          oneTimeInstruction
        });

        if (response.skip) { showNotice('warning', response.reason || 'Not enough context.'); return; }
        if (response.success && response.message) {
          renderSingleResult(response.message);
          showNotice('success', 'Reply generated! Review and click Send.');
        } else {
          throw new Error(response.error || 'Failed to generate reply.');
        }
      } catch (err) {
        showNotice('error', err.message || 'Unable to generate. Please try again.');
      } finally {
        setLoading(false, autoBtn);
      }
    }

    autoBtn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); runAutoReply(); });
    inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runAutoReply(); } });

    // Keyboard shortcut Ctrl+Shift+M
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault(); runAutoReply();
      }
    });

    // --- Style Buttons ---
    styleBtns.forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        clearNotice(); resultsEl.innerHTML = '';
        setLoading(true, btn, 'Generating...');
        try {
          const { recipient, conversation } = await gatherMessageContextOrThrow(composer);
          const { persona, behavior } = await getStoredSettings();
          const response = await requestGenerateMessage({
            recipient, conversation, persona, behavior,
            style: btn.getAttribute('data-style'),
            oneTimeInstruction: inputEl.value.trim() || null
          });
          if (response.skip) { showNotice('warning', response.reason || 'Not enough context.'); return; }
          if (response.success && response.message) {
            renderSingleResult(response.message);
          } else throw new Error(response.error || 'Failed.');
        } catch (err) {
          showNotice('error', err.message || 'Unable to generate. Try again.');
        } finally {
          setLoading(false, btn);
        }
      });
    });

    // --- All 3 Styles ---
    allBtn.addEventListener('click', async e => {
      e.preventDefault(); e.stopPropagation();
      clearNotice(); resultsEl.innerHTML = '';
      setLoading(true, allBtn, 'Generating all 3...');
      try {
        const { recipient, conversation } = await gatherMessageContextOrThrow(composer);
        const { persona, behavior } = await getStoredSettings();
        const response = await requestGenerateAllMessages({
          recipient, conversation, persona, behavior,
          oneTimeInstruction: inputEl.value.trim() || null
        });
        if (response.skip) { showNotice('warning', response.reason || 'Not enough context.'); return; }
        if (response.success && response.messages) {
          renderAllResults(response.messages);
        } else throw new Error(response.error || 'Failed.');
      } catch (err) {
        showNotice('error', err.message || 'Unable to generate. Try again.');
      } finally {
        setLoading(false, allBtn);
      }
    });
  }

  function scanAndInjectMessages() {
    const composers = findUnprocessedMessageComposers();
    composers.forEach(composer => injectMessageToolbar(composer));
  }

  scanAndInjectMessages();
  observeLinkedInMessageComposers(composer => injectMessageToolbar(composer));

  document.addEventListener('click', e => {
    const t = e.target;
    if (t.closest && (
      t.closest('.msg-form') ||
      t.closest('.msg-overlay-conversation-bubble') ||
      t.closest('.msg-convo-wrapper') ||
      t.closest('[class*="msg-"]')
    )) {
      setTimeout(scanAndInjectMessages, 100);
      setTimeout(scanAndInjectMessages, 400);
    }
  }, true);

})();
