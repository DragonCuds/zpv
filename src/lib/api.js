const BASE_URL = 'https://amirrezaei2002x.shop/api';

function getToken() {
  return localStorage.getItem('zpv_token');
}

async function request(method, path, body = null) {
  const token = getToken();
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      errorMsg = err.message || JSON.stringify(err);
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function register({ username, phone, password }) {
  const data = await request('POST', '/register', { username, phone, password });
  if (data?.token) {
    localStorage.setItem('zpv_token', data.token);
    localStorage.setItem('zpv_user', JSON.stringify(data.user));
  }
  return data;
}

export async function login({ username, password }) {
  const data = await request('POST', '/login', { username, password });
  if (data?.token) {
    localStorage.setItem('zpv_token', data.token);
    localStorage.setItem('zpv_user', JSON.stringify(data.user));
  }
  return data;
}

export async function logout() {
  try { await request('POST', '/logout'); } finally {
    localStorage.removeItem('zpv_token');
    localStorage.removeItem('zpv_user');
  }
}

export async function getMe() {
  return request('GET', '/me');
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function searchUsers(q) {
  return request('GET', `/users/search?q=${encodeURIComponent(q)}`);
}

// ─── Chat Requests ────────────────────────────────────────────────────────────

export async function getChatRequests() {
  return request('GET', '/chat-requests');
}

export async function sendChatRequest({ receiver_username }) {
  return request('POST', '/chat-requests', { receiver_username });
}

export async function acceptChatRequest(id) {
  return request('POST', `/chat-requests/${id}/accept`);
}

export async function rejectChatRequest(id) {
  return request('POST', `/chat-requests/${id}/reject`);
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
  
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        // Content-Type نذار — مرورگر خودش boundary میذاره
      },
      body: formData,
    });
  
    if (!res.ok) throw new Error('Upload failed');
  
    const data = await res.json();
    return data.file_url; // ← فقط URL برمیگرده
  }


// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversations() {
  return request('GET', '/conversations');
}

export async function getMessages(conversationId) {
  return request('GET', `/conversations/${conversationId}/messages`);
}

export async function sendMessage(conversationId, { content, type = 'text', file_url = null, client_message_id = null }) {
  return request('POST', `/conversations/${conversationId}/messages`, {
    content, type, file_url, client_message_id,
  });
}

export async function markMessagesRead(conversationId) {
  return request('POST', `/conversations/${conversationId}/messages/read`);
}