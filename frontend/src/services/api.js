const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Sends a chat message to the RAG backend.
 * @param {string} message - The user's input message.
 * @param {Array} history - The chat history array of {role, content} objects.
 * @returns {Promise<Object>} The chat response and sources citation.
 */
export async function sendMessage(message, history = [], mode = 'advice') {
  try {
    const formattedHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        history: formattedHistory,
        mode: mode
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to process message.');
    }

    return await response.json();
  } catch (error) {
    console.error('API sendMessage error:', error);
    throw error;
  }
}

/**
 * Checks the health status of the FastAPI backend.
 * @returns {Promise<Object>} The health status response.
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Backend server is not responding correctly.');
    }

    return await response.json();
  } catch (error) {
    console.error('API checkHealth error:', error);
    throw error;
  }
}
