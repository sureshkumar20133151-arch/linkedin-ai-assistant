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
    tone: "Professional, Natural, Helpful, Confident, Not overly promotional"
  };

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
      <div class="linkedin-ai-actions">
        <button type="button" class="linkedin-ai-btn" data-style="professional">Professional</button>
        <button type="button" class="linkedin-ai-btn" data-style="insightful">Insightful</button>
        <button type="button" class="linkedin-ai-btn" data-style="short">Short</button>
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
    const buttons = toolbar.querySelectorAll('.linkedin-ai-btn');
    const inputEl = toolbar.querySelector('.linkedin-ai-input');
    const noticeContainer = toolbar.querySelector('.linkedin-ai-notice-container');

    buttons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const style = btn.getAttribute('data-style');
        const oneTimeInstruction = inputEl.value.trim();

        // UI Loading State
        setLoadingState(buttons, btn, true);
        noticeContainer.innerHTML = '';

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
            setLoadingState(buttons, btn, false);
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
          setLoadingState(buttons, btn, false);
        }
      });
    });
  }

  // Toggle button loading states
  function setLoadingState(buttons, activeBtn, isLoading) {
    buttons.forEach(b => {
      b.disabled = isLoading;
    });

    if (isLoading) {
      activeBtn.setAttribute('data-original-text', activeBtn.innerText);
      activeBtn.innerHTML = `<span class="linkedin-ai-spinner"></span> Generating...`;
    } else {
      buttons.forEach(b => {
        const orig = b.getAttribute('data-original-text');
        if (orig) b.innerText = orig;
      });
    }
  }

  // Display status notice banner
  function showNotice(container, type, message, copyText = null) {
    container.innerHTML = '';
    const notice = document.createElement('div');
    notice.className = `linkedin-ai-notice ${type}`;
    
    let content = `<span>${message}</span>`;
    if (copyText) {
      content += `<button type="button" class="linkedin-ai-copy-btn">Copy Comment</button>`;
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
