/**
 * LinkedIn Comment Editor Inserter
 * Reliably inserts generated text into LinkedIn's React contenteditable editors.
 * 
 * LinkedIn's comment box works in stages:
 * 1. Placeholder state: "Add a comment..." (no contenteditable yet)
 * 2. User clicks placeholder -> React mounts the real contenteditable editor
 * 3. Only then can we insert text
 * 
 * This module handles activating the editor if needed.
 */

function findCommentEditor(startElement) {
  if (!startElement) return null;

  // Strategy 1: Direct search inside startElement
  const directEditor = startElement.querySelector('div[contenteditable="true"], div[role="textbox"]');
  if (directEditor) return directEditor;

  // Strategy 2: Search upward through parents until we find a post-level container,
  // then search downward for any contenteditable editor
  let current = startElement;
  let depth = 0;
  while (current && depth < 15 && current !== document.body) {
    const editor = current.querySelector('div[contenteditable="true"], div[role="textbox"]');
    if (editor && !editor.closest('.linkedin-ai-toolbar-container')) {
      return editor;
    }
    current = current.parentElement;
    depth++;
  }

  // Strategy 3: Search siblings of the toolbar
  if (startElement.parentElement) {
    const siblings = startElement.parentElement.children;
    for (const sibling of siblings) {
      if (sibling.classList && sibling.classList.contains('linkedin-ai-toolbar-container')) continue;
      const editor = sibling.querySelector ? sibling.querySelector('div[contenteditable="true"], div[role="textbox"]') : null;
      if (editor) return editor;
    }
  }

  return null;
}

function findAndClickCommentPlaceholder(startElement) {
  // LinkedIn shows "Add a comment..." as a clickable element that triggers the real editor
  let current = startElement;
  let depth = 0;
  while (current && depth < 15 && current !== document.body) {
    // Look for the placeholder input/button
    const placeholders = current.querySelectorAll(
      '.comments-comment-box__form-container, ' +
      '.comments-comment-texteditor, ' +
      '.comments-comment-box, ' +
      'button[class*="comment"], ' +
      'div[class*="comment-box"], ' +
      'input[placeholder*="comment"], ' +
      'div[data-placeholder]'
    );
    for (const ph of placeholders) {
      if (ph && typeof ph.click === 'function') {
        ph.click();
        return true;
      }
    }
    current = current.parentElement;
    depth++;
  }
  return false;
}

async function insertCommentIntoEditor(composerOrToolbar, text) {
  // Try finding an existing editor first
  let editor = findCommentEditor(composerOrToolbar);

  // If no editor found, try clicking the placeholder to activate it
  if (!editor) {
    findAndClickCommentPlaceholder(composerOrToolbar);
    // Wait for React to mount the editor
    await new Promise(r => setTimeout(r, 500));
    editor = findCommentEditor(composerOrToolbar);
  }

  // Second attempt with longer delay
  if (!editor) {
    await new Promise(r => setTimeout(r, 500));
    editor = findCommentEditor(composerOrToolbar);
  }

  // If still no editor, return graceful failure (copy fallback will show)
  if (!editor) {
    console.warn('[AI Assistant] Could not locate active contenteditable editor. Showing copy fallback.');
    return { success: false, reason: 'Comment editor not activated. Click "Add a comment..." first, then try again.' };
  }

  try {
    editor.click();
    editor.focus();

    // Wait a tick for focus to settle
    await new Promise(r => setTimeout(r, 100));

    // Strategy 1: Select all content & use execCommand insertText
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    const inserted = document.execCommand('insertText', false, text);

    // Verify Strategy 1 worked
    const content1 = (editor.innerText || editor.textContent || '').trim();
    if (inserted && content1.length > 0 && content1.includes(text.substring(0, Math.min(15, text.length)))) {
      console.log('[AI Assistant] Comment inserted via execCommand!');
      return { success: true };
    }

    // Strategy 2: Direct innerHTML + synthetic events
    editor.innerHTML = '';
    const p = document.createElement('p');
    p.textContent = text;
    editor.appendChild(p);

    editor.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }));
    editor.dispatchEvent(new Event('change', { bubbles: true }));

    // Verify Strategy 2
    const content2 = (editor.innerText || editor.textContent || '').trim();
    if (content2.length > 0) {
      console.log('[AI Assistant] Comment inserted via innerHTML!');
      return { success: true };
    }

    return { success: false, reason: 'Text insertion verification failed.' };
  } catch (err) {
    console.error('[AI Assistant] Error during comment insertion:', err);
    return { success: false, reason: err.message };
  }
}

async function copyCommentToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { findCommentEditor, insertCommentIntoEditor, copyCommentToClipboard };
}
