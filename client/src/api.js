const API_BASE = '/api';

// ============ Token 管理 ============

export function getToken() {
  return localStorage.getItem('emoji_token');
}

export function setToken(token) {
  localStorage.setItem('emoji_token', token);
}

export function removeToken() {
  localStorage.removeItem('emoji_token');
  localStorage.removeItem('emoji_user');
}

export function getUser() {
  const raw = localStorage.getItem('emoji_user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user) {
  localStorage.setItem('emoji_user', JSON.stringify(user));
}

function authHeaders() {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ============ 认证 API ============

export async function register(username, password, nickname) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, nickname })
  });
  const data = await res.json();
  if (data.success) {
    setToken(data.token);
    setUser(data.user);
  }
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.success) {
    setToken(data.token);
    setUser(data.user);
  }
  return data;
}

export function logout() {
  removeToken();
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders()
  });
  if (res.status === 401) {
    removeToken();
    return { success: false, error: '未登录' };
  }
  return res.json();
}

// ============ 合集 API ============

export async function createCollection(name, description = '') {
  const res = await fetch(`${API_BASE}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ name, description })
  });
  return res.json();
}

export async function getCollections() {
  const res = await fetch(`${API_BASE}/collections`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function getCollection(id) {
  const res = await fetch(`${API_BASE}/collections/${id}`, {
    headers: authHeaders()
  });
  return res.json();
}

export async function deleteCollection(id) {
  const res = await fetch(`${API_BASE}/collections/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return res.json();
}

export async function uploadEmojis(collectionId, files, onProgress) {
  const formData = new FormData();
  files.forEach(file => formData.append('emojis', file));

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/collections/${collectionId}/emojis`);

    // 设置认证 header
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(xhr.responseText));
      }
    };
    xhr.onerror = () => reject(new Error('上传失败'));
    xhr.send(formData);
  });
}

export async function deleteEmoji(collectionId, emojiId) {
  const res = await fetch(`${API_BASE}/collections/${collectionId}/emojis/${emojiId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return res.json();
}

export async function getShareInfo(id) {
  const res = await fetch(`${API_BASE}/collections/${id}/share`, {
    headers: authHeaders()
  });
  return res.json();
}

export function getDownloadUrl(collectionId) {
  return `${API_BASE}/collections/${collectionId}/download`;
}

export function getEmojiDownloadUrl(collectionId, emojiId) {
  return `${API_BASE}/collections/${collectionId}/emojis/${emojiId}/download`;
}

