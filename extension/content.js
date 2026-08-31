/**
 * Personal LinkedIn AI Assistant - Main Content Script
 */

(function () {
  console.log('[AI Assistant] LinkedIn Content Script Initialized.');

  // Default Fallback Persona
  const DEFAULT_PERSONA = {
    role: "Website Developer",
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "APIs", "Automation", "Web Applications"],
    services: ["Business Website Development", "Web Application Development", "Ecommerce Website Development", "API Integration", "Automation", "Custom Web Solutions"],
    targetAudience: ["Small business owners", "Entrepreneurs", "Startups", "Businesses looking for websites", "People looking for developers"],
    tone: "Professional, Natural, Helpful, Confident, Not overly promotional",
    detailedProfile: ""
  };

  // All tone options shown in the "Choose Tone" dropdown when a comment
  // composer is opened. Keys must match STYLE_LABELS in
  // server/prompts/commentPrompt.js and validStyles in server/utils/validation.js.
  const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional' },
    { value: 'insightful', label: 'Insightful' },
    { value: 'short', label: 'Short' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'congratulatory', label: 'Congratulatory' },
    { value: 'question', label: 'Question' },
    { value: 'storytelling', label: 'Storytelling' },
    { value: 'contrarian', label: 'Contrarian' },
    { value: 'humorous', label: 'Humorous' }
  ];

  const TONE_LABEL_MAP = Object.fromEntries(TONE_OPTIONS.map(t => [t.value, t.label]));

  // Closes every open tone dropdown on the page (in case multiple comment
  // composers/toolbars are open at once) — called before opening a new one.
  function closeAllToneMenus() {
    document.querySelectorAll('.linkedin-ai-tone-menu').forEach(menu => menu.setAttribute('hidden', ''));
    document.querySelectorAll('.linkedin-ai-tone-toggle').forEach(t => t.classList.remove('open'));
  }

  // Helper: Get stored persona & behavior
  async function getStoredSettings() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['persona', 'assistantBehavior'], result => {
          resolve({
            persona: result.persona || DEFAULT_PERSONA,
            behavior: result.assistantBehavior || {}
          });
        });
      } else {
        resolve({ persona: DEFAULT_PERSONA, behavior: {} });
      }
    });
  }

  // Create & inject AI Toolbar into a detected comment composer
  function injectAIToolbar(composer) {
    if (!composer || composer.getAttribute('data-ai-assistant-toolbar')) return;

    // Mark composer container
    composer.setAttribute('data-ai-assistant-toolbar', 'true');

    // Check if toolbar already exists nearby to prevent duplicates
    if (composer.parentElement && composer.parentElement.querySelector('.linkedin-ai-toolbar-container')) {
      return;
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'linkedin-ai-toolbar-container';
    toolbar.innerHTML = `
      <div class="linkedin-ai-header">
        <div class="linkedin-ai-title">
          <span class="linkedin-ai-sparkle">✨</span> AI Comment
        </div>
        <button type="button" class="linkedin-ai-analyze-profile-btn" title="Analyze author's full profile to classify role (Founder / Recruiter / HR)">
          🔍 Analyze Profile
        </button>
      </div>
      <div class="linkedin-ai-recommend-banner" hidden></div>
      <div class="linkedin-ai-tone-select-wrapper">
        <button type="button" class="linkedin-ai-tone-toggle">
          <span class="linkedin-ai-tone-toggle-label">Choose Tone</span>
          <span class="linkedin-ai-tone-toggle-caret">▾</span>
        </button>
        <div class="linkedin-ai-tone-menu" hidden>
          ${TONE_OPTIONS.map(t => `<button type="button" class="linkedin-ai-tone-menu-item" data-style="${t.value}">${t.label}</button>`).join('')}
        </div>
      </div>
      <div class="linkedin-ai-prompt-box">
        <input type="text" class="linkedin-ai-input" placeholder="One-time instruction for this comment (optional)..." />
      </div>
      <div class="linkedin-ai-notice-container"></div>
    `;

    // Insertion Strategy: Insert toolbar directly before the composer element in the DOM
    if (composer.parentNode) {
      composer.parentNode.insertBefore(toolbar, composer);
    } else {
      composer.appendChild(toolbar);
    }

    // Attach button event handlers
    const recommendBanner = toolbar.querySelector('.linkedin-ai-recommend-banner');
    const toneToggle = toolbar.querySelector('.linkedin-ai-tone-toggle');
    const toneToggleLabel = toolbar.querySelector('.linkedin-ai-tone-toggle-label');
    const toneMenu = toolbar.querySelector('.linkedin-ai-tone-menu');
    const buttons = toolbar.querySelectorAll('.linkedin-ai-tone-menu-item');
    const inputEl = toolbar.querySelector('.linkedin-ai-input');
    const noticeContainer = toolbar.querySelector('.linkedin-ai-notice-container');
    const analyzeBtn = toolbar.querySelector('.linkedin-ai-analyze-profile-btn');

    // All interactive controls (tone dropdown toggle + analyze btn + every tone option),
    // used together so clicking one disables the rest while a request is in flight.
    const allInteractiveButtons = [toneToggle, analyzeBtn, ...buttons];

    // Cache the post context after the FIRST successful extraction (whether
    // from the automatic tone recommendation or a manual tone click) and
    // reuse it for every subsequent tone click on this same toolbar. Without
    // this, every click re-extracts from the live DOM, and on LinkedIn's
    // search-results page a scroll/re-render in between clicks can make the
    // composer reference stale, causing "0 chars" extraction failures that
    // make it look like tones can't be switched at all.
    let cachedPostContext = null;
    async function getPostContext() {
      if (cachedPostContext && cachedPostContext.postText && cachedPostContext.postText.length >= 20) {
        return cachedPostContext;
      }
      const ctx = await extractPostContext(composer);
      if (ctx && ctx.postText && ctx.postText.length >= 20) {
        cachedPostContext = ctx;
      }
      return ctx;
    }

    // Open/close the tone dropdown
    toneToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = toneMenu.hasAttribute('hidden');
      closeAllToneMenus();
      if (isHidden) {
        toneMenu.removeAttribute('hidden');
        toneToggle.classList.add('open');
      }
    });

    // Close this dropdown if the user clicks anywhere outside it
    document.addEventListener('click', (e) => {
      if (!toolbar.contains(e.target)) {
        toneMenu.setAttribute('hidden', '');
        toneToggle.classList.remove('open');
      }
    });

    // Manual 'Analyze Profile' click handler
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = `<span class="linkedin-ai-spinner"></span> Analyzing...`;

        try {
          const postContext = await getPostContext();
          if (!postContext.authorProfileUrl) {
            showNotice(noticeContainer, 'warning', 'Could not locate author profile URL on this post.');
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🔍 Analyze Profile';
            return;
          }

          showNotice(noticeContainer, 'info', `Analyzing ${postContext.authorName}'s full profile...`);

          const response = await new Promise(res => {
            chrome.runtime.sendMessage({
              type: 'ANALYZE_PROFILE',
              profileUrl: postContext.authorProfileUrl
            }, res);
          });

          if (response && response.success && response.profileData) {
            postContext.authorProfile = response.profileData;
            cachedPostContext = postContext; // Update cache
            analyzeBtn.textContent = 'Profile Analyzed! ✓';
            showNotice(noticeContainer, 'info', `Analyzed ${postContext.authorName}'s profile! AI will now tailor the pitch to their role type.`);
          } else {
            throw new Error(response?.error || 'Could not extract profile details.');
          }
        } catch (err) {
          console.warn('[AI Assistant] Analyze profile failed:', err);
          showNotice(noticeContainer, 'warning', 'Profile analysis failed or timed out.');
          analyzeBtn.disabled = false;
          analyzeBtn.textContent = '🔍 Analyze Profile';
        }
      });
    }

    // Fire-and-forget: analyze the post and recommend a tone as soon as the
    // toolbar appears, so the user has guidance before opening the dropdown.
    loadToneRecommendation({ toolbar, composer, recommendBanner, getPostContext });

    buttons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const style = btn.getAttribute('data-style');
        const oneTimeInstruction = inputEl.value.trim();

        // Close the dropdown and reflect the chosen tone on the toggle button
        toneMenu.setAttribute('hidden', '');
        toneToggle.classList.remove('open');
        toneToggleLabel.textContent = btn.textContent.replace(/^⭐\s*/, '');

        // UI Loading State
        setLoadingState(allInteractiveButtons, btn, true);
        noticeContainer.innerHTML = '';

        try {
          // 1. Get post context (reuses the cached extraction if we already
          // have one from a previous tone click or the auto-recommendation)
          const postContext = await getPostContext();
          console.log('[AI Assistant] Full extracted context:', JSON.stringify(postContext, null, 2));
          if (!postContext || !postContext.postText || postContext.postText.length < 10) {
            throw new Error(`Could not extract post text (got ${postContext?.postText?.length || 0} chars). Try scrolling to make the full post visible, then click again.`);
          }

          // 2. Load stored persona & behavior memory
          const { persona, behavior } = await getStoredSettings();

          // 3. Request comment generation from backend
          const response = await requestGenerateComment({
            post: postContext,
            persona,
            behavior,
            style,
            oneTimeInstruction: oneTimeInstruction || null
          });

          // Handle IRRELEVANT POST (SKIP)
          if (response.skip) {
            showNotice(noticeContainer, 'warning', response.reason || "This post doesn't appear relevant to your profile.");
            setLoadingState(allInteractiveButtons, btn, false);
            return;
          }

          // Handle Generated Comment Insertion (Async)
          if (response.success && response.comment) {
            const insertResult = await insertCommentIntoEditor(composer, response.comment);

            if (insertResult.success) {
              showNotice(noticeContainer, 'info', 'Comment inserted! Review and click Post when ready.');
            } else {
              // Copy Fallback
              showNotice(noticeContainer, 'warning', `Couldn't insert automatically.`, response.comment);
            }

            if (response.dmPitch) {
              renderDMPitchCard(noticeContainer, response.dmPitch, postContext.authorName, composer);
            }
          } else {
            throw new Error(response.error || 'Failed to generate comment.');
          }

        } catch (err) {
          console.error('[AI Assistant Error]', err);
          showNotice(noticeContainer, 'error', err.message || 'Unable to generate comment. Please try again.');
        } finally {
          setLoadingState(allInteractiveButtons, btn, false);
        }
      });
    });
  }

  // Toggle button loading states (thin wrapper over the shared helper,
  // kept for readability at call sites within this file)
  function setLoadingState(buttons, activeBtn, isLoading, loadingLabel = 'Generating...') {
    return setToolbarLoadingState(buttons, activeBtn, isLoading, loadingLabel);
  }

  // Analyzes the post (once per composer) and shows a "⭐ Recommended: X"
  // banner + highlights the matching tone in the dropdown, so the user has
  // guidance on which tone fits this specific post before picking one.
  async function loadToneRecommendation({ toolbar, composer, recommendBanner, getPostContext }) {
    try {
      recommendBanner.hidden = false;
      recommendBanner.className = 'linkedin-ai-recommend-banner loading';
      recommendBanner.textContent = 'Analyzing post to recommend a tone...';

      const postContext = await getPostContext();
      if (!postContext || !postContext.postText || postContext.postText.length < 10) {
        recommendBanner.hidden = true;
        return;
      }

      const { persona, behavior } = await getStoredSettings();
      const result = await requestRecommendTone({ post: postContext, persona, behavior });

      if (!result || !result.success || !result.recommendedTone) {
        recommendBanner.hidden = true;
        return;
      }

      const label = TONE_LABEL_MAP[result.recommendedTone] || result.recommendedTone;
      recommendBanner.className = 'linkedin-ai-recommend-banner';
      recommendBanner.innerHTML = `⭐ <strong>Recommended: ${label}</strong>${result.reason ? ` — ${result.reason}` : ''}`;

      const matchBtn = toolbar.querySelector(`.linkedin-ai-tone-menu-item[data-style="${result.recommendedTone}"]`);
      if (matchBtn && !matchBtn.textContent.startsWith('⭐')) {
        matchBtn.classList.add('recommended');
        matchBtn.textContent = `⭐ ${matchBtn.textContent}`;
      }
    } catch (err) {
      // Recommendation is a nice-to-have — never block or error out the
      // actual comment-generation flow if this fails.
      console.warn('[AI Assistant] Tone recommendation failed:', err.message);
      recommendBanner.hidden = true;
    }
  }

  // Display status notice banner
  function showNotice(container, type, message, copyText = null) {
    return showToolbarNotice(container, type, message, copyText);
  }

  // Scan and inject toolbars
  function scanAndInject() {
    const composers = findUnprocessedCommentComposers();
    composers.forEach(composer => injectAIToolbar(composer));
  }

  // Initial Scan & MutationObserver setup
  scanAndInject();
  observeLinkedInComposers(composer => {
    injectAIToolbar(composer);
  });

  // Also trigger scan on click or focus inside LinkedIn feed / comment areas
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (
      target.closest && (
        target.closest('.comments-comment-box') ||
        target.closest('.feed-shared-comment-box') ||
        target.closest('.comments-comment-texteditor') ||
        target.closest('div[contenteditable="true"]') ||
        target.closest('button.comment-button') ||
        target.closest('.artdeco-button')
      )
    ) {
      setTimeout(scanAndInject, 100);
      setTimeout(scanAndInject, 400);
    }
  }, true);

})();
