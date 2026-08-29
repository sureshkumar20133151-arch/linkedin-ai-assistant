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
      </div>
      <div class="linkedin-ai-tone-select-wrapper">
        <button type="button" class="linkedin-ai-tone-toggle">
          <span class="linkedin-ai-tone-toggle-label">Choose Tone</span>
          <span class="linkedin-ai-tone-toggle-caret">▾</span>
        </button>
        <div class="linkedin-ai-tone-menu" hidden>
          ${TONE_OPTIONS.map(t => `<button type="button" class="linkedin-ai-tone-menu-item" data-style="${t.value}">${t.label}</button>`).join('')}
        </div>
      </div>
      <div class="linkedin-ai-actions-secondary">
        <button type="button" class="linkedin-ai-btn-all" data-style="all">✨ Generate All 3</button>
      </div>
      <div class="linkedin-ai-prompt-box">
        <input type="text" class="linkedin-ai-input" placeholder="One-time instruction for this comment (optional)..." />
      </div>
      <div class="linkedin-ai-multi-results"></div>
      <div class="linkedin-ai-notice-container"></div>
    `;

    // Insertion Strategy: Insert toolbar directly before the composer element in the DOM
    if (composer.parentNode) {
      composer.parentNode.insertBefore(toolbar, composer);
    } else {
      composer.appendChild(toolbar);
    }

    // Attach button event handlers
    const toneToggle = toolbar.querySelector('.linkedin-ai-tone-toggle');
    const toneToggleLabel = toolbar.querySelector('.linkedin-ai-tone-toggle-label');
    const toneMenu = toolbar.querySelector('.linkedin-ai-tone-menu');
    const buttons = toolbar.querySelectorAll('.linkedin-ai-tone-menu-item');
    const allBtn = toolbar.querySelector('.linkedin-ai-btn-all');
    const inputEl = toolbar.querySelector('.linkedin-ai-input');
    const noticeContainer = toolbar.querySelector('.linkedin-ai-notice-container');
    const multiResultsContainer = toolbar.querySelector('.linkedin-ai-multi-results');

    // All interactive controls (tone dropdown toggle + every tone option +
    // the "Generate All" button), used together so clicking one disables the
    // rest while a request is in flight.
    const allInteractiveButtons = [toneToggle, ...buttons, allBtn];

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

    allBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const oneTimeInstruction = inputEl.value.trim();

      setLoadingState(allInteractiveButtons, allBtn, true, 'Generating all 3...');
      noticeContainer.innerHTML = '';
      multiResultsContainer.innerHTML = '';

      try {
        const postContext = await extractPostContext(composer);
        console.log('[AI Assistant] Full extracted context:', JSON.stringify(postContext, null, 2));
        if (!postContext || !postContext.postText || postContext.postText.length < 10) {
          throw new Error(`Could not extract post text (got ${postContext?.postText?.length || 0} chars). Try scrolling to make the full post visible, then click again.`);
        }

        const { persona, behavior } = await getStoredSettings();

        const response = await requestGenerateAllComments({
          post: postContext,
          persona,
          behavior,
          oneTimeInstruction: oneTimeInstruction || null
        });

        if (response.skip) {
          showNotice(noticeContainer, 'warning', response.reason || "This post doesn't appear relevant to your profile.");
          return;
        }

        if (response.success && response.comments) {
          renderMultiResults(multiResultsContainer, response.comments, composer, noticeContainer);
        } else {
          throw new Error(response.error || 'Failed to generate comments.');
        }
      } catch (err) {
        console.error('[AI Assistant Error]', err);
        showNotice(noticeContainer, 'error', err.message || 'Unable to generate comments. Please try again.');
      } finally {
        setLoadingState(allInteractiveButtons, allBtn, false);
      }
    });

    buttons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const style = btn.getAttribute('data-style');
        const oneTimeInstruction = inputEl.value.trim();

        // Close the dropdown and reflect the chosen tone on the toggle button
        toneMenu.setAttribute('hidden', '');
        toneToggle.classList.remove('open');
        toneToggleLabel.textContent = btn.textContent;

        // UI Loading State
        setLoadingState(allInteractiveButtons, btn, true);
        noticeContainer.innerHTML = '';
        multiResultsContainer.innerHTML = '';

        try {
          // 1. Isolate and extract relative post context (async - expands "...more" if needed)
          const postContext = await extractPostContext(composer);
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

  // Render the 3 generated comment variants (Professional / Insightful / Short)
  // side-by-side so the user can pick exactly one to insert into LinkedIn's editor.
  function renderMultiResults(container, comments, composer, noticeContainer) {
    return renderToolbarResultCards(container, comments, (text) => insertCommentIntoEditor(composer, text), noticeContainer);
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
