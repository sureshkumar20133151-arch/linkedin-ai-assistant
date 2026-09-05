/**
 * Settings & Options Controller for Personal LinkedIn AI Assistant
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Navigation Tab Elements
  const navItems = document.querySelectorAll('.nav-item');
  const tabSections = document.querySelectorAll('.tab-section');
  const tabTitle = document.getElementById('tabTitle');

  // Form Fields
  const inputRole = document.getElementById('role');
  const inputTone = document.getElementById('tone');
  const inputSkills = document.getElementById('skills');
  const inputServices = document.getElementById('services');
  const inputTargetAudience = document.getElementById('targetAudience');
  const inputDetailedProfile = document.getElementById('detailedProfile');
  const inputPortfolioUrl = document.getElementById('portfolioUrl');
  const inputLinkedInUrl = document.getElementById('linkedInUrl');
  const inputBackendUrl = document.getElementById('backendUrl');

  // Action Buttons
  const btnSaveProfile = document.getElementById('btnSaveProfile');
  const btnSendChat = document.getElementById('btnSendChat');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const behaviorRulesList = document.getElementById('behaviorRulesList');
  const btnAddRule = document.getElementById('btnAddRule');
  const btnResetBehavior = document.getElementById('btnResetBehavior');
  const btnTestBackend = document.getElementById('btnTestBackend');
  const btnResetAll = document.getElementById('btnResetAll');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusLabel = document.getElementById('statusLabel');

  // Tab titles dictionary
  const tabTitles = {
    profile: 'My Developer Profile & Persona',
    behavior: '🧠 Assistant Behavior Chat',
    memory: 'Saved Behavior Rules & Memory',
    backend: 'Backend API Connection'
  };

  // Switch Tab Handler
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');

      navItems.forEach(nav => nav.classList.remove('active'));
      tabSections.forEach(sec => sec.classList.remove('active'));

      item.classList.add('active');
      const targetSection = document.getElementById(`section-${targetTab}`);
      if (targetSection) targetSection.classList.add('active');

      tabTitle.textContent = tabTitles[targetTab] || 'Settings';
    });
  });

  // Load Settings from chrome.storage.local
  function loadSettings() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['persona', 'assistantBehavior', 'backendUrl', 'behaviorChatHistory'], result => {
        const persona = result.persona || {};
        const behavior = result.assistantBehavior || {};
        const chatHistory = result.behaviorChatHistory || [];

        inputRole.value = persona.role || '';
        inputTone.value = persona.tone || '';
        inputSkills.value = Array.isArray(persona.skills) ? persona.skills.join(', ') : persona.skills || '';
        inputServices.value = Array.isArray(persona.services) ? persona.services.join(', ') : persona.services || '';
        inputTargetAudience.value = Array.isArray(persona.targetAudience) ? persona.targetAudience.join(', ') : persona.targetAudience || '';
        inputDetailedProfile.value = persona.detailedProfile || '';
        inputPortfolioUrl.value = persona.portfolioUrl || '';
        inputLinkedInUrl.value = persona.linkedInUrl || '';

        if (result.backendUrl) {
          inputBackendUrl.value = result.backendUrl;
        }

        renderBehaviorRules(behavior);
        renderBehaviorChat(persona, behavior, chatHistory);
      });
    }
  }

  // Render Assistant Behavior Chat Context & History
  function renderBehaviorChat(persona, behavior, chatHistory = []) {
    chatMessages.innerHTML = '';

    const activeInstructions = behavior?.activeInstructions || [
      "Don't start comments with 'Great post'",
      "Keep comments natural and non-promotional",
      "Don't use emojis"
    ];

    const rulesHtml = activeInstructions.map(r => `<li>✓ ${escapeHtml(r)}</li>`).join('');
    const roleText = persona?.role || 'Full Stack Web Developer';
    const portfolioText = persona?.portfolioUrl || 'https://solodeveloper.pro/';
    const linkedInText = persona?.linkedInUrl || 'https://www.linkedin.com/in/suresh-kumar3151/';

    const contextBubble = document.createElement('div');
    contextBubble.className = 'chat-bubble assistant';
    contextBubble.innerHTML = `
      <strong>🤖 Active Prompt & Memory Context Injected:</strong><br>
      <div style="margin-top: 6px; font-size: 13px; line-height: 1.5;">
        <strong>👤 Active Developer Persona:</strong> ${escapeHtml(roleText)}<br>
        <strong>🌐 Portfolio Link:</strong> <a href="${escapeHtml(portfolioText)}" target="_blank" style="color: #2563eb;">${escapeHtml(portfolioText)}</a><br>
        <strong>🔗 LinkedIn Profile:</strong> <a href="${escapeHtml(linkedInText)}" target="_blank" style="color: #2563eb;">${escapeHtml(linkedInText)}</a><br>
        <strong style="display: block; margin-top: 8px;">📜 Active Rules Memory (${activeInstructions.length} rules loaded):</strong>
        <ul style="margin: 4px 0 0 18px; padding: 0;">${rulesHtml}</ul>
      </div>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.85;">
        💡 <em>Type any instruction below (e.g. "Don't use emojis", "Keep comments under 20 words", "Always add portfolio link") to update my memory!</em>
      </div>
    `;
    chatMessages.appendChild(contextBubble);

    // Render stored chat conversation history
    if (Array.isArray(chatHistory)) {
      chatHistory.forEach(item => {
        appendChatMessage(item.sender, item.text, false);
      });
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Render Saved Behavior Rules List
  function renderBehaviorRules(behavior) {
    behaviorRulesList.innerHTML = '';
    const activeInstructions = behavior?.activeInstructions || [
      "Don't start comments with 'Great post'",
      "Keep comments natural and non-promotional",
      "Don't use emojis"
    ];

    if (activeInstructions.length === 0) {
      behaviorRulesList.innerHTML = '<div class="rule-item"><span class="rule-text">No custom rules saved yet. Chat with your assistant to add rules!</span></div>';
      return;
    }

    activeInstructions.forEach((instructionText, index) => {
      const item = document.createElement('div');
      item.className = 'rule-item';
      item.innerHTML = `
        <div class="rule-left">
          <input type="checkbox" class="rule-toggle" checked data-index="${index}">
          <span class="rule-text">✓ ${escapeHtml(instructionText)}</span>
        </div>
        <div class="rule-actions">
          <button type="button" class="btn-icon btn-edit-rule" data-index="${index}">Edit</button>
          <button type="button" class="btn-icon btn-delete-rule" data-index="${index}">Delete</button>
        </div>
      `;
      behaviorRulesList.appendChild(item);
    });

    // Attach Event Listeners for Rule Toggles & Deletes
    behaviorRulesList.querySelectorAll('.rule-toggle').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const parent = e.target.closest('.rule-item');
        if (e.target.checked) parent.classList.remove('disabled');
        else parent.classList.add('disabled');
      });
    });

    behaviorRulesList.querySelectorAll('.btn-delete-rule').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        activeInstructions.splice(index, 1);
        const updatedBehavior = { ...behavior, activeInstructions };
        await saveBehaviorToStorage(updatedBehavior);
        renderBehaviorRules(updatedBehavior);
        chrome.storage.local.get(['persona', 'behaviorChatHistory'], res => {
          renderBehaviorChat(res.persona, updatedBehavior, res.behaviorChatHistory || []);
        });
      });
    });

    behaviorRulesList.querySelectorAll('.btn-edit-rule').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const index = parseInt(btn.getAttribute('data-index'), 10);
        const currentText = activeInstructions[index];
        const newText = prompt('Edit behavior rule:', currentText);
        if (newText && newText.trim()) {
          activeInstructions[index] = newText.trim();
          const updatedBehavior = { ...behavior, activeInstructions };
          await saveBehaviorToStorage(updatedBehavior);
          renderBehaviorRules(updatedBehavior);
          chrome.storage.local.get(['persona', 'behaviorChatHistory'], res => {
            renderBehaviorChat(res.persona, updatedBehavior, res.behaviorChatHistory || []);
          });
        }
      });
    });
  }

  // Save Persona Profile Handler
  btnSaveProfile.addEventListener('click', () => {
    const formFields = {
      role: inputRole.value.trim(),
      tone: inputTone.value.trim(),
      skills: inputSkills.value.split(',').map(s => s.trim()).filter(Boolean),
      services: inputServices.value.split(',').map(s => s.trim()).filter(Boolean),
      targetAudience: inputTargetAudience.value.split(',').map(s => s.trim()).filter(Boolean),
      detailedProfile: inputDetailedProfile.value.trim(),
      portfolioUrl: inputPortfolioUrl.value.trim(),
      linkedInUrl: inputLinkedInUrl.value.trim()
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['persona', 'assistantBehavior', 'behaviorChatHistory'], result => {
        const persona = { ...(result.persona || {}), ...formFields };
        chrome.storage.local.set({ persona, backendUrl: inputBackendUrl.value.trim() }, () => {
          renderBehaviorChat(persona, result.assistantBehavior, result.behaviorChatHistory || []);
          alert('Profile & Settings saved successfully!');
        });
      });
    }
  });

  // Assistant Behavior Chat Handler
  btnSendChat.addEventListener('click', async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append User Message
    appendChatMessage('user', text);
    chatInput.value = '';

    await saveChatMessageHistory('user', text);

    try {
      // Fetch the locally-persisted behavior (the real source of truth,
      // since the backend's own memory can reset on a serverless cold
      // start) and send it along so the backend merges rather than
      // silently dropping rules saved in a previous session.
      const currentBehavior = await new Promise(resolve => {
        chrome.storage.local.get(['assistantBehavior'], res => resolve(res.assistantBehavior || {}));
      });

      // Call Backend API to interpret behavior instruction
      const response = await sendBehaviorInstruction(text, currentBehavior);
      const replyMsg = response.message || 'Understood! I will follow this preference for your future comments.';
      
      appendChatMessage('assistant', replyMsg);
      await saveChatMessageHistory('assistant', replyMsg);

      if (response.behavior) {
        await saveBehaviorToStorage(response.behavior);
        renderBehaviorRules(response.behavior);
      }
    } catch (err) {
      // Offline fallback: Add rule locally
      const replyMsg = `Got it! I saved your preference: "${text}"`;
      appendChatMessage('assistant', replyMsg);
      await saveChatMessageHistory('assistant', replyMsg);
      
      chrome.storage.local.get(['assistantBehavior'], result => {
        const current = result.assistantBehavior || {};
        const instructions = current.activeInstructions || [];
        instructions.push(text);
        const updated = { ...current, activeInstructions: [...new Set(instructions)] };
        saveBehaviorToStorage(updated);
        renderBehaviorRules(updated);
      });
    }
  });

  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') btnSendChat.click();
  });

  // Add Custom Rule Button Handler
  btnAddRule.addEventListener('click', () => {
    const rule = prompt('Enter new behavior rule (e.g. "Keep comments short"):');
    if (rule && rule.trim()) {
      chrome.storage.local.get(['assistantBehavior', 'persona', 'behaviorChatHistory'], result => {
        const current = result.assistantBehavior || {};
        const activeInstructions = current.activeInstructions || [];
        activeInstructions.push(rule.trim());
        const updated = { ...current, activeInstructions: [...new Set(activeInstructions)] };
        saveBehaviorToStorage(updated);
        renderBehaviorRules(updated);
        renderBehaviorChat(result.persona, updated, result.behaviorChatHistory || []);
      });
    }
  });

  // Reset Behavior Button Handler
  btnResetBehavior.addEventListener('click', () => {
    if (confirm('Reset assistant behavior to default state?')) {
      const defaultBehavior = {
        tone: "natural and professional",
        promotionLevel: "low",
        useEmojis: false,
        genericPraise: false,
        commentLength: "short",
        activeInstructions: [
          "Don't start comments with 'Great post'",
          "Keep comments natural and non-promotional",
          "Don't use emojis"
        ]
      };
      chrome.storage.local.set({ behaviorChatHistory: [] });
      saveBehaviorToStorage(defaultBehavior);
      renderBehaviorRules(defaultBehavior);
      chrome.storage.local.get(['persona'], res => {
        renderBehaviorChat(res.persona, defaultBehavior, []);
      });
    }
  });

  // Test Backend Button Handler
  btnTestBackend.addEventListener('click', async () => {
    // Save the entered URL to storage first so the test uses the new value
    const newUrl = inputBackendUrl.value.trim();
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await new Promise(r => chrome.storage.local.set({ backendUrl: newUrl }, r));
    }

    statusIndicator.style.background = '#f1f5f9';
    statusIndicator.style.color = '#64748b';
    statusLabel.textContent = 'Testing...';

    const health = await checkBackendHealth();
    if (health.status === 'online') {
      statusIndicator.style.background = '#dcfce7';
      statusIndicator.style.color = '#15803d';
      statusLabel.textContent = 'Backend Connected ✅';
    } else {
      statusIndicator.style.background = '#fee2e2';
      statusIndicator.style.color = '#b91c1c';
      statusLabel.textContent = 'Backend Offline ❌';
    }
  });

  // Helper Functions
  async function saveBehaviorToStorage(behavior) {
    return new Promise(resolve => {
      chrome.storage.local.set({ assistantBehavior: behavior }, resolve);
    });
  }

  async function saveChatMessageHistory(sender, text) {
    return new Promise(resolve => {
      chrome.storage.local.get(['behaviorChatHistory'], result => {
        const history = result.behaviorChatHistory || [];
        history.push({ sender, text, timestamp: Date.now() });
        const trimmed = history.slice(-50);
        chrome.storage.local.set({ behaviorChatHistory: trimmed }, resolve);
      });
    });
  }

  function appendChatMessage(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerHTML = `<strong>${sender === 'user' ? 'You' : 'Assistant'}:</strong> ${escapeHtml(text)}`;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Initial Load
  loadSettings();
  btnTestBackend.click();
});
