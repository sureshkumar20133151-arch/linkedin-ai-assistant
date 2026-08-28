/**
 * LinkedIn Comment Editor Inserter
 * Reliably inserts generated text into LinkedIn's React contenteditable editors.
 */

function findCommentEditor(commentComposer) {
  if (!commentComposer) return null;
  return querySelectorFallback(commentComposer, LINKEDIN_SELECTORS.commentEditors);
}

function insertCommentIntoEditor(commentComposer, text) {
  const editor = findCommentEditor(commentComposer);

  if (!editor) {
    console.error('[AI Assistant] Could not find contenteditable comment editor.');
    return { success: false, reason: 'Comment editor not found in DOM.' };
  }

  try {
    editor.focus();

    // Strategy 1: Select all & execCommand (updates Draft.js/React state cleanly)
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    const inserted = document.execCommand('insertText', false, text);

    if (!inserted || !editor.innerText.includes(text.substring(0, 15))) {
      // Strategy 2: Direct DOM manipulation with InputEvent dispatching
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
    // Fallback using temporary textarea
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
