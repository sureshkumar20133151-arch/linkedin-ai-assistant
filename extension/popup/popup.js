/**
 * Chrome Extension Popup Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const userRole = document.getElementById('userRole');
  const userTone = document.getElementById('userTone');
  const btnOpenSettings = document.getElementById('btnOpenSettings');
  const btnTestConnection = document.getElementById('btnTestConnection');
  const feedbackBox = document.getElementById('feedbackBox');

  // Load Persona from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['persona'], result => {
      if (result.persona) {
        userRole.textContent = result.persona.role || 'Website Developer';
        userTone.textContent = result.persona.tone || 'Professional & Natural';
      }
    });
  }

  // Check Backend Connection
  async function checkHealth() {
    statusBadge.className = 'status-badge checking';
    statusText.textContent = 'Checking...';

    const health = await checkBackendHealth();
    if (health.status === 'online') {
      statusBadge.className = 'status-badge online';
      statusText.textContent = 'Connected';
    } else {
      statusBadge.className = 'status-badge offline';
      statusText.textContent = 'Backend Offline';
    }
    return health;
  }

  await checkHealth();

  // Button: Open Options Page
  btnOpenSettings.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  });

  // Button: Test Connection
  btnTestConnection.addEventListener('click', async () => {
    btnTestConnection.disabled = true;
    btnTestConnection.textContent = 'Testing...';
    feedbackBox.className = 'feedback-box hidden';

    const health = await checkHealth();

    btnTestConnection.disabled = false;
    btnTestConnection.textContent = 'Test AI Connection';

    if (health.status === 'online') {
      feedbackBox.className = 'feedback-box success';
      feedbackBox.textContent = `Backend Connected! Gemini Model: ${health.model || 'gemini-2.5-flash'}`;
    } else {
      feedbackBox.className = 'feedback-box error';
      feedbackBox.textContent = `Connection Failed: ${health.error || 'Server not reachable on http://localhost:3000'}`;
    }
  });
});
