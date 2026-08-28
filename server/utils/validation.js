/**
 * Request validation utilities for LinkedIn AI Assistant API
 */

function validateGenerateCommentRequest(req) {
  const { post, persona, style } = req.body;

  if (!post || typeof post !== 'object') {
    return { valid: false, message: 'Missing or invalid "post" object in request body.' };
  }

  if (!post.postText || typeof post.postText !== 'string' || !post.postText.trim()) {
    return { valid: false, message: 'Post content ("postText") cannot be empty.' };
  }

  const validStyles = ['professional', 'insightful', 'short'];
  if (!style || !validStyles.includes(style.toLowerCase())) {
    return { valid: false, message: `Invalid comment style "${style}". Must be one of: ${validStyles.join(', ')}` };
  }

  return { valid: true };
}

function validateGenerateAllCommentsRequest(req) {
  const { post } = req.body;

  if (!post || typeof post !== 'object') {
    return { valid: false, message: 'Missing or invalid "post" object in request body.' };
  }

  if (!post.postText || typeof post.postText !== 'string' || !post.postText.trim()) {
    return { valid: false, message: 'Post content ("postText") cannot be empty.' };
  }

  return { valid: true };
}

function validateGenerateMessageRequest(req) {
  const { recipient, conversation } = req.body;

  const hasRecipientName = recipient && typeof recipient === 'object' && recipient.name && recipient.name.trim();
  const hasConversationHistory = conversation && Array.isArray(conversation.messages) && conversation.messages.length > 0;

  if (!hasRecipientName && !hasConversationHistory) {
    return { valid: false, message: 'Missing recipient info — need at least a recipient name or existing conversation history.' };
  }

  return { valid: true };
}

function validateBehaviorRequest(req) {
  const { instruction } = req.body;

  if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
    return { valid: false, message: 'Instruction string is required.' };
  }

  return { valid: true };
}

function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text.trim();
}

module.exports = {
  validateGenerateCommentRequest,
  validateGenerateAllCommentsRequest,
  validateGenerateMessageRequest,
  validateBehaviorRequest,
  sanitizeText
};
