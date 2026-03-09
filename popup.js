// popup.js — Momo Bookmark 弹出窗口（直连 Discord Webhook）

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

async function sendBookmark(url, note) {
  const config = await getConfig();
  const webhookUrl = config.webhookUrl;

  if (!webhookUrl) {
    throw new Error('请先在设置中填写 Webhook URL');
  }

  let content = url;
  if (note) content += `\n> ${note}`;

  const resp = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      username: 'Bookmark',
      avatar_url: 'https://raw.githubusercontent.com/momomo-agent/momo-bookmark-extension/main/icons/webhook-avatar.png',
    }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Discord ${resp.status}: ${err.slice(0, 100)}`);
  }
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

  // 没配置 webhook 时提示设置
  if (!config.webhookUrl) {
    status.textContent = '⚙️ 请先在设置中填写 Webhook URL';
  }
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
  const webhookUrl = webhookInput.value.trim();
  if (webhookUrl && !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    status.textContent = '⚠️ Webhook URL 格式不对';
    return;
  }
  await saveConfig({ webhookUrl });
  settingsView.classList.remove('active');
  mainView.style.display = 'block';
  status.textContent = webhookUrl ? '✅ 设置已保存' : '⚠️ 请填写 Webhook URL';
});

// 快捷键：Enter 发送
noteInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});
