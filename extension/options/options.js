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
      chrome.storage.local.get(['persona', 'assistantBehavior', 'backendUrl'], result => {
        if (result.persona) {
          inputRole.value = result.persona.role || '';
          inputTone.value = result.persona.tone || '';
          inputSkills.value = Array.isArray(result.persona.skills) ? result.persona.skills.join(', ') : result.persona.skills || '';
          inputServices.value = Array.isArray(result.persona.services) ? result.persona.services.join(', ') : result.persona.services || '';
          inputTargetAudience.value = Array.isArray(result.persona.targetAudience) ? result.persona.targetAudience.join(', ') : result.persona.targetAudience || '';
          inputDetailedProfile.value = result.persona.detailedProfile || '';
        }
        if (result.backendUrl) {
          inputBackendUrl.value = result.backendUrl;
        }
        renderBehaviorRules(result.assistantBehavior);
      });
    }
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
        }
      });
    });
  }

  // Save Persona Profile Handler
  btnSaveProfile.addEventListener('click', () => {
    const persona = {
      role: inputRole.value.trim(),
      tone: inputTone.value.trim(),
      skills: inputSkills.value.split(',').map(s => s.trim()).filter(Boolean),
      services: inputServices.value.split(',').map(s => s.trim()).filter(Boolean),
      targetAudience: inputTargetAudience.value.split(',').map(s => s.trim()).filter(Boolean),
      detailedProfile: inputDetailedProfile.value.trim()
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ persona, backendUrl: inputBackendUrl.value.trim() }, () => {
        alert('Profile & Settings saved successfully!');
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

    try {
      // Call Backend API to interpret behavior instruction
      const response = await sendBehaviorInstruction(text);
      
      appendChatMessage('assistant', response.message || 'Understood! I will follow this preference for your future comments.');

      if (response.behavior) {
        await saveBehaviorToStorage(response.behavior);
        renderBehaviorRules(response.behavior);
      }
    } catch (err) {
      // Offline fallback: Add rule locally
      appendChatMessage('assistant', `Got it! I saved your preference: "${text}"`);
      
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
      chrome.storage.local.get(['assistantBehavior'], result => {
        const current = result.assistantBehavior || {};
        const activeInstructions = current.activeInstructions || [];
        activeInstructions.push(rule.trim());
        const updated = { ...current, activeInstructions: [...new Set(activeInstructions)] };
        saveBehaviorToStorage(updated);
        renderBehaviorRules(updated);
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
      saveBehaviorToStorage(defaultBehavior);
      renderBehaviorRules(defaultBehavior);
    }
  });

  // Test Backend Button Handler
  btnTestBackend.addEventListener('click', async () => {
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
