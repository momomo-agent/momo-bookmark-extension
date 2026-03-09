// popup.js — Momo Bookmark 弹出窗口逻辑

const STORAGE_KEY = 'momo_bookmark_config';
const DEFAULT_ENDPOINT = 'https://bookmark.momomo.dev';
const DEFAULT_API_KEY = '2a353730f2e8cd9b967f30032ec58957a9946be4cc85f975';

async function getConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, data => {
      resolve(data[STORAGE_KEY] || {});
    });
  });
}

async function saveConfig(config) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: config }, resolve);
  });
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendBookmark(url, note) {
  const config = await getConfig();
  const endpoint = config.endpoint || DEFAULT_ENDPOINT;
  const apiKey = config.apiKey || DEFAULT_API_KEY;

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ url, note: note || undefined }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

// ── UI ──

const urlPreview = document.getElementById('url-preview');
const noteInput = document.getElementById('note');
const sendBtn = document.getElementById('send-btn');
const status = document.getElementById('status');
const settingsToggle = document.getElementById('settings-toggle');
const backToggle = document.getElementById('back-toggle');
const mainView = document.getElementById('main-view');
const settingsView = document.getElementById('settings-view');
const endpointInput = document.getElementById('endpoint-url');
const apiKeyInput = document.getElementById('api-key');
const saveBtn = document.getElementById('save-btn');

let currentUrl = '';

// 初始化
(async () => {
  const tab = await getCurrentTab();
  currentUrl = tab.url;
  urlPreview.textContent = currentUrl;
  urlPreview.title = currentUrl;

  const config = await getConfig();
  if (config.endpoint) endpointInput.value = config.endpoint;
  if (config.apiKey) apiKeyInput.value = config.apiKey;
})();

// 发送
sendBtn.addEventListener('click', async () => {
  sendBtn.disabled = true;
  sendBtn.textContent = '发送中...';
  status.textContent = '';

  try {
    const note = noteInput.value.trim();
    await sendBookmark(currentUrl, note);

    sendBtn.className = 'btn btn-success';
    sendBtn.textContent = '✅ 已收藏';
    status.textContent = '已发送到 #bookmark';

    setTimeout(() => window.close(), 1500);
  } catch (e) {
    sendBtn.className = 'btn btn-error';
    sendBtn.textContent = '发送失败';
    status.textContent = e.message;
    setTimeout(() => {
      sendBtn.className = 'btn btn-primary';
      sendBtn.textContent = '收藏到 #bookmark';
      sendBtn.disabled = false;
    }, 2000);
  }
});

// 设置切换
settingsToggle.addEventListener('click', () => {
  mainView.style.display = 'none';
  settingsView.classList.add('active');
});
backToggle.addEventListener('click', () => {
  settingsView.classList.remove('active');
  mainView.style.display = 'block';
});

// 保存设置
saveBtn.addEventListener('click', async () => {
  const config = {
    endpoint: endpointInput.value.trim() || DEFAULT_ENDPOINT,
    apiKey: apiKeyInput.value.trim() || DEFAULT_API_KEY,
  };
  await saveConfig(config);
  settingsView.classList.remove('active');
  mainView.style.display = 'block';
  status.textContent = '设置已保存';
});

// 快捷键：Enter 发送
noteInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});
