// popup.js — Momo Bookmark 弹出窗口逻辑

const STORAGE_KEY = 'momo_bookmark_config';

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

async function sendToDiscord(webhookUrl, username, content) {
  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username || 'kenefe',
      content,
    }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp;
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
const webhookInput = document.getElementById('webhook-url');
const usernameInput = document.getElementById('username');
const saveBtn = document.getElementById('save-btn');

let currentUrl = '';

// 初始化
(async () => {
  const tab = await getCurrentTab();
  currentUrl = tab.url;
  urlPreview.textContent = currentUrl;
  urlPreview.title = currentUrl;

  const config = await getConfig();
  if (config.webhookUrl) webhookInput.value = config.webhookUrl;
  if (config.username) usernameInput.value = config.username;

  if (!config.webhookUrl) {
    // 没配置过，直接显示设置
    mainView.style.display = 'none';
    settingsView.classList.add('active');
  }
})();

// 发送
sendBtn.addEventListener('click', async () => {
  const config = await getConfig();
  if (!config.webhookUrl) {
    status.textContent = '请先设置 Webhook URL';
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = '发送中...';
  status.textContent = '';

  try {
    const note = noteInput.value.trim();
    const content = note ? `${currentUrl}\n> ${note}` : currentUrl;
    await sendToDiscord(config.webhookUrl, config.username, content);

    sendBtn.className = 'btn btn-success';
    sendBtn.textContent = '✅ 已收藏';
    status.textContent = '已发送到 #bookmark';

    // 1.5s 后关闭
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
    webhookUrl: webhookInput.value.trim(),
    username: usernameInput.value.trim() || 'kenefe',
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
