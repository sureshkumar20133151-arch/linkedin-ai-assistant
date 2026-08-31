/**
 * Personal LinkedIn AI Assistant - Messaging (DM Inbox) Content Script
 *
 * Mirrors content.js (feed/post comments) but for LinkedIn Direct Messages:
 *   - No prior conversation with this person -> drafts a cold outreach opener.
 *   - They've already messaged the user -> drafts a contextual reply.
 * Mode is decided server-side from whatever conversation history this file
 * manages to extract (see messageExtractor.js).
 */

(function () {
  console.log('[AI Assistant] LinkedIn Messaging Content Script Initialized.');

  // DEFAULT_PERSONA is defined in shared/config.js (loaded first via manifest.json)

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

  async function gatherMessageContextOrThrow(composer) {
    const { recipient, conversation } = await extractMessageContext(composer);
    if (!recipient.name && (!conversation.messages || conversation.messages.length === 0)) {
      throw new Error('Could not detect who you\'re messaging. Make sure the conversation is fully loaded, then try again.');
    }
    return { recipient, conversation };
  }

  function injectMessageToolbar(composer) {
    if (!composer || composer.getAttribute('data-ai-assistant-msg-toolbar')) return;

    composer.setAttribute('data-ai-assistant-msg-toolbar', 'true');

    if (composer.parentElement && composer.parentElement.querySelector('.linkedin-ai-toolbar-container')) {
      return;
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'linkedin-ai-toolbar-container';
    toolbar.innerHTML = `
      <div class="linkedin-ai-header">
        <div class="linkedin-ai-title">
          <span class="linkedin-ai-sparkle">✨</span> AI Message
        </div>
      </div>
      <div class="linkedin-ai-actions">
        <button type="button" class="linkedin-ai-btn" data-style="professional">Professional</button>
        <button type="button" class="linkedin-ai-btn" data-style="insightful">Insightful</button>
        <button type="button" class="linkedin-ai-btn" data-style="short">Short</button>
      </div>
      <div class="linkedin-ai-actions-secondary">
        <button type="button" class="linkedin-ai-btn-all" data-style="all">✨ Generate All 3</button>
      </div>
      <div class="linkedin-ai-prompt-box">
        <input type="text" class="linkedin-ai-input" placeholder="One-time instruction for this message (optional)..." />
      </div>
      <div class="linkedin-ai-multi-results"></div>
      <div class="linkedin-ai-notice-container"></div>
    `;

    if (composer.parentNode) {
      composer.parentNode.insertBefore(toolbar, composer);
    } else {
      composer.appendChild(toolbar);
    }

    const buttons = toolbar.querySelectorAll('.linkedin-ai-btn');
    const allBtn = toolbar.querySelector('.linkedin-ai-btn-all');
    const inputEl = toolbar.querySelector('.linkedin-ai-input');
    const noticeContainer = toolbar.querySelector('.linkedin-ai-notice-container');
    const multiResultsContainer = toolbar.querySelector('.linkedin-ai-multi-results');

    const allInteractiveButtons = [...buttons, allBtn];

    allBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const oneTimeInstruction = inputEl.value.trim();
      setToolbarLoadingState(allInteractiveButtons, allBtn, true, 'Generating all 3...');
      noticeContainer.innerHTML = '';
      multiResultsContainer.innerHTML = '';

      try {
        const { recipient, conversation } = await gatherMessageContextOrThrow(composer);
        const { persona, behavior } = await getStoredSettings();

        const response = await requestGenerateAllMessages({
          recipient, conversation, persona, behavior, oneTimeInstruction: oneTimeInstruction || null
        });

        if (response.skip) {
          showToolbarNotice(noticeContainer, 'warning', response.reason || "Not enough context to draft messages yet.");
          return;
        }

        if (response.success && response.messages) {
          renderToolbarResultCards(multiResultsContainer, response.messages, (text) => insertCommentIntoEditor(composer, text), noticeContainer);
        } else {
          throw new Error(response.error || 'Failed to generate messages.');
        }
      } catch (err) {
        console.error('[AI Assistant Error]', err);
        showToolbarNotice(noticeContainer, 'error', err.message || 'Unable to generate messages. Please try again.');
      } finally {
        setToolbarLoadingState(allInteractiveButtons, allBtn, false);
      }
    });

    buttons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const style = btn.getAttribute('data-style');
        const oneTimeInstruction = inputEl.value.trim();

        setToolbarLoadingState(allInteractiveButtons, btn, true);
        noticeContainer.innerHTML = '';
        multiResultsContainer.innerHTML = '';

        try {
          const { recipient, conversation } = await gatherMessageContextOrThrow(composer);
          const { persona, behavior } = await getStoredSettings();

          const response = await requestGenerateMessage({
            recipient, conversation, persona, behavior, style, oneTimeInstruction: oneTimeInstruction || null
          });

          if (response.skip) {
            showToolbarNotice(noticeContainer, 'warning', response.reason || "Not enough context to draft a message yet.");
            setToolbarLoadingState(allInteractiveButtons, btn, false);
            return;
          }

          if (response.success && response.message) {
            const insertResult = await insertCommentIntoEditor(composer, response.message);

            if (insertResult.success) {
              showToolbarNotice(noticeContainer, 'info', 'Message inserted! Review and click Send when ready.');
            } else {
              showToolbarNotice(noticeContainer, 'warning', `Couldn't insert automatically.`, response.message);
            }
          } else {
            throw new Error(response.error || 'Failed to generate message.');
          }
        } catch (err) {
          console.error('[AI Assistant Error]', err);
          showToolbarNotice(noticeContainer, 'error', err.message || 'Unable to generate message. Please try again.');
        } finally {
          setToolbarLoadingState(allInteractiveButtons, btn, false);
        }
      });
    });
  }

  function scanAndInjectMessages() {
    const composers = findUnprocessedMessageComposers();
    composers.forEach(composer => injectMessageToolbar(composer));
  }

  scanAndInjectMessages();
  observeLinkedInMessageComposers(composer => {
    injectMessageToolbar(composer);
  });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (
      target.closest && (
        target.closest('.msg-form') ||
        target.closest('.msg-overlay-conversation-bubble') ||
        target.closest('.msg-convo-wrapper') ||
        target.closest('[class*="msg-"]')
      )
    ) {
      setTimeout(scanAndInjectMessages, 100);
      setTimeout(scanAndInjectMessages, 400);
    }
  }, true);

})();
