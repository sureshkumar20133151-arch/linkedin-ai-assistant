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

async function requestGenerateComment({ post, persona, behavior, style, oneTimeInstruction }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate-comment`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post,
        persona,
        behavior,
        style,
        oneTimeInstruction
      }),
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
    if (err.name === 'AbortError') {
      throw new Error('Request timed out while connecting to AI backend.');
    }
    throw new Error(err.message || 'Unable to connect to backend server. Make sure the server is running on http://localhost:3000');
  }
}

async function requestGenerateAllComments({ post, persona, behavior, oneTimeInstruction }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate-comment-all`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post,
        persona,
        behavior,
        oneTimeInstruction
      }),
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
    if (err.name === 'AbortError') {
      throw new Error('Request timed out while connecting to AI backend.');
    }
    throw new Error(err.message || 'Unable to connect to backend server. Make sure the server is running on http://localhost:3000');
  }
}

async function requestGenerateMessage({ recipient, conversation, persona, behavior, style, oneTimeInstruction }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate-message`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient,
        conversation,
        persona,
        behavior,
        style,
        oneTimeInstruction
      }),
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
    if (err.name === 'AbortError') {
      throw new Error('Request timed out while connecting to AI backend.');
    }
    throw new Error(err.message || 'Unable to connect to backend server. Make sure the server is running on http://localhost:3000');
  }
}

async function requestGenerateAllMessages({ recipient, conversation, persona, behavior, oneTimeInstruction }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/generate-message-all`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient,
        conversation,
        persona,
        behavior,
        oneTimeInstruction
      }),
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
    if (err.name === 'AbortError') {
      throw new Error('Request timed out while connecting to AI backend.');
    }
    throw new Error(err.message || 'Unable to connect to backend server. Make sure the server is running on http://localhost:3000');
  }
}

async function requestRecommendTone({ post, persona, behavior }) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/recommend-comment-tone`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post,
        persona,
        behavior
      }),
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
    if (err.name === 'AbortError') {
      throw new Error('Request timed out while connecting to AI backend.');
    }
    throw new Error(err.message || 'Unable to connect to backend server.');
  }
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

async function sendBehaviorInstruction(instruction) {
  const baseUrl = await getBackendUrl();
  const endpoint = `${baseUrl.replace(/\/$/, '')}/api/assistant/behavior`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instruction })
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
