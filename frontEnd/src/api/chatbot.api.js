import api from './axios';

/**
 * Sends a chat message to the SurpriseNest AI chatbot.
 * @param {string} message - The current message from the user.
 * @param {Array} history - Previous messages in the session.
 * @returns {Promise} Axios response promise
 */
export const sendChatRequest = (message, history, messageDetails) => {
  return api.post('/chatbot/chat', { message, history, messageDetails });
};
