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
    icp: '🎯 ICP Research — Ideal Client Persona',
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

  // ── ICP Research Logic ───────────────────────────────────────────────────
  let lastICPReport = '';

  const btnGenerateICP   = document.getElementById('btnGenerateICP');
  const btnCopyICP       = document.getElementById('btnCopyICP');
  const btnDownloadICP   = document.getElementById('btnDownloadICP');
  const icpReportCard    = document.getElementById('icpReportCard');
  const icpStatus        = document.getElementById('icpStatus');
  const icpReportContent = document.getElementById('icpReportContent');

  function renderICPMarkdown(md) {
    // Convert markdown to a readable formatted HTML (basic renderer)
    return md
      .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
      .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
      .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
      .replace(/^###\s+(.+)$/gm, '<h3 style="color:#0a66c2;margin:18px 0 6px;">$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2 style="color:#0a66c2;margin:20px 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1 style="color:#0a66c2;margin:0 0 16px;">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>')
      .replace(/^\|\s*(.+)\s*\|$/gm, (match) => {
        const cells = match.split('|').filter(c => c.trim() !== '');
        const isHeader = cells.every(c => /^[-: ]+$/.test(c.trim()));
        if (isHeader) return '<tr class="table-sep"></tr>';
        return '<tr>' + cells.map(c => `<td style="padding:6px 10px;border:1px solid #e2e8f0;">${c.trim()}</td>`).join('') + '</tr>';
      })
      .replace(/(<tr.*<\/tr>)+/gs, match => `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:12.5px;">${match}</table>`)
      .replace(/^- (.+)$/gm, '<li style="margin:3px 0;">$1</li>')
      .replace(/(<li.*<\/li>)+/gs, match => `<ul style="margin:6px 0 10px 18px;padding:0;">${match}</ul>`)
      .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:3px 0;">$2</li>')
      .replace(/\n{2,}/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  if (btnGenerateICP) {
    btnGenerateICP.addEventListener('click', async () => {
      const targetAudience = document.getElementById('icpTargetAudience').value.trim();
      const whatYouHelp    = document.getElementById('icpWhatYouHelp').value.trim();
      const howYouHelp     = document.getElementById('icpHowYouHelp').value.trim();
      const desiredResult  = document.getElementById('icpDesiredResult').value.trim();
      const countries      = document.getElementById('icpCountries').value.trim();
      const pricePoint     = document.getElementById('icpPricePoint').value.trim();

      if (!targetAudience) {
        alert('Please enter your target audience first!');
        return;
      }

      btnGenerateICP.disabled = true;
      btnGenerateICP.textContent = '⏳ Generating ICP Report...';
      icpReportCard.style.display = 'block';
      icpStatus.textContent = '🔄 Analyzing your offer and generating full ICP report (this may take 20-40 seconds)...';
      icpStatus.className = 'icp-status loading';
      icpReportContent.innerHTML = '';
      btnCopyICP.style.display = 'none';
      btnDownloadICP.style.display = 'none';

      try {
        const storedSettings = await new Promise(resolve =>
          chrome.storage.local.get(['persona'], r => resolve(r))
        );
        const persona = storedSettings.persona || {};

        const backendUrl = await new Promise(resolve =>
          chrome.storage.local.get(['backendUrl'], r => resolve(r.backendUrl || 'https://linkedin-ai-assistant-dun.vercel.app'))
        );

        const response = await fetch(`${backendUrl.replace(/\/$/, '')}/api/generate-icp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetAudience, whatYouHelp, howYouHelp, desiredResult, countries, pricePoint, persona })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || `Server error ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.report) {
          lastICPReport = data.report;
          icpStatus.textContent = '✅ ICP Report generated successfully!';
          icpStatus.className = 'icp-status success';
          icpReportContent.innerHTML = renderICPMarkdown(lastICPReport);
          btnCopyICP.style.display = 'inline-flex';
          btnDownloadICP.style.display = 'inline-flex';
        } else {
          throw new Error(data.error || 'Failed to generate ICP report.');
        }
      } catch (err) {
        icpStatus.textContent = `❌ Error: ${err.message}`;
        icpStatus.className = 'icp-status error';
      } finally {
        btnGenerateICP.disabled = false;
        btnGenerateICP.textContent = '🎯 Generate ICP Report';
      }
    });
  }

  if (btnCopyICP) {
    btnCopyICP.addEventListener('click', async () => {
      if (!lastICPReport) return;
      try {
        await navigator.clipboard.writeText(lastICPReport);
        btnCopyICP.textContent = '✓ Copied!';
        setTimeout(() => { btnCopyICP.textContent = '📋 Copy Full Report'; }, 2000);
      } catch (e) {
        alert('Copy failed — please select and copy manually.');
      }
    });
  }

  if (btnDownloadICP) {
    btnDownloadICP.addEventListener('click', () => {
      if (!lastICPReport) return;
      const blob = new Blob([lastICPReport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ICP-Report-${new Date().toISOString().slice(0,10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  // ── End ICP Research Logic ───────────────────────────────────────────────

  // Initial Load
  loadSettings();
  btnTestBackend.click();
});
