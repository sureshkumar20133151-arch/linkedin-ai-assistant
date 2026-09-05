/**
 * Backend API Client for Extension
 */

const DEFAULT_BACKEND_URL = 'https://linkedin-ai-assistant-dun.vercel.app';

async function getBackendUrl() {
  return new Promise(resolve => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['backendUrl'], result => {
        resolve(result.backendUrl || DEFAULT_BACKEND_URL);
      });
    } else {
      resolve(DEFAULT_BACKEND_URL);
    }
  });
}

async function fetchWithTimeoutAndRetry(endpoint, fetchOptions, timeoutMs = 45000, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend server returned error ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError' || (err.message && (err.message.includes('504') || err.message.includes('timeout')));
      if (isTimeout && attempt < retries) {
        console.warn(`[AI Assistant API] Request timed out on attempt ${attempt + 1}. Retrying for backend cold start...`);
        continue;
      }
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The AI backend may be cold-starting — please try again in a few seconds.');
      }
      throw new Error(err.message || 'Unable to connect to AI backend. Please check your internet connection.');
    }
  }
}

async function requestGenerateComment({ post, persona, behavior, style, oneTimeInstruction }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate-comment`;

  return await fetchWithTimeoutAndRetry(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post, persona, behavior, style, oneTimeInstruction })
  }, 45000, 1);
}

async function requestGenerateAllComments({ post, persona, behavior, oneTimeInstruction }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate-comment-all`;

  return await fetchWithTimeoutAndRetry(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post, persona, behavior, oneTimeInstruction })
  }, 60000, 1);
}

async function requestGenerateMessage({ recipient, conversation, persona, behavior, style, oneTimeInstruction }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate-message`;

  return await fetchWithTimeoutAndRetry(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient, conversation, persona, behavior, style, oneTimeInstruction })
  }, 45000, 1);
}

async function requestGenerateAllMessages({ recipient, conversation, persona, behavior, oneTimeInstruction }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate-message-all`;

  return await fetchWithTimeoutAndRetry(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipient, conversation, persona, behavior, oneTimeInstruction })
  }, 60000, 1);
}

async function requestRecommendTone({ post, persona, behavior }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/recommend-comment-tone`;

  return await fetchWithTimeoutAndRetry(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post, persona, behavior })
  }, 25000, 1);
}

async function checkBackendHealth() {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/health`;

  try {
    const response = await fetch(endpoint, { method: 'GET' });
    if (response.ok) {
      return await response.json();
    }
    return { status: 'offline', error: `HTTP ${response.status}` };
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

async function sendBehaviorInstruction(instruction, currentBehavior) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/assistant/behavior`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instruction, currentBehavior })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update assistant behavior.');
  }

  return await response.json();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { requestGenerateComment, requestGenerateAllComments, requestRecommendTone, requestGenerateMessage, requestGenerateAllMessages, checkBackendHealth, sendBehaviorInstruction };
}
