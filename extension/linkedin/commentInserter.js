/**
 * LinkedIn Comment Editor Inserter
 * Reliably inserts generated text into LinkedIn's React contenteditable editors.
 */

function findCommentEditor(commentComposer) {
  if (!commentComposer) return null;

  // 1. Try finding contenteditable editor inside comment composer
  let editor = querySelectorFallback(commentComposer, LINKEDIN_SELECTORS.commentEditors);
  if (editor) return editor;

  // 2. Look in parent post container or parent element
  const postElement = commentComposer.closest ? commentComposer.closest('div.feed-shared-update-v2, article, li, div[data-urn]') : null;
  if (postElement) {
    editor = querySelectorFallback(postElement, LINKEDIN_SELECTORS.commentEditors);
    if (editor) return editor;
  }

  // 3. Fallback: Search in parentElement
  if (commentComposer.parentElement) {
    editor = commentComposer.parentElement.querySelector('div[contenteditable="true"], div[role="textbox"]');
    if (editor) return editor;
  }

  return document.querySelector('div.comments-comment-box div[contenteditable="true"], div[contenteditable="true"]');
}

function insertCommentIntoEditor(commentComposer, text) {
  let editor = findCommentEditor(commentComposer);

  if (!editor) {
    console.error('[AI Assistant] Could not find contenteditable comment editor.');
    return { success: false, reason: 'Comment editor not found in DOM.' };
  }

  try {
    // If editor is hidden or not focused, trigger click to open LinkedIn's rich text editor
    editor.click();
    editor.focus();

    // Strategy 1: Select all & execCommand (updates Draft.js/React state cleanly)
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    let inserted = document.execCommand('insertText', false, text);

    // Strategy 2: If execCommand didn't insert, use Range + InputEvent dispatching
    if (!inserted || !editor.innerText || !editor.innerText.includes(text.substring(0, 15))) {
      editor.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;

      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      });

      const changeEvent = new Event('change', { bubbles: true });

      editor.dispatchEvent(inputEvent);
      editor.dispatchEvent(changeEvent);
    }

    // Strategy 3: Target paragraph inside Draft.js if present
    const pTag = editor.querySelector('p');
    if (pTag && (!pTag.innerText || pTag.innerText.trim().length === 0)) {
      pTag.innerText = text;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Verify insertion
    const currentContent = editor.innerText || editor.textContent || '';
    if (currentContent.trim().length > 0) {
      console.log('[AI Assistant] Comment successfully inserted into LinkedIn editor!');
      return { success: true };
    } else {
      return { success: false, reason: 'Text insertion verification failed.' };
    }
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
