// twitter-button.js — Twitter/X 推文收藏按钮（直连 Discord Webhook）

const STORAGE_KEY = 'momo_bookmark_config';

function getConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, data => {
      resolve(data[STORAGE_KEY] || {});
    });
  });
}

async function sendToBookmark(url) {
  const config = await getConfig();
  if (!config.webhookUrl) {
    showToast('请先在插件设置中填写 Webhook URL', true);
    return;
  }

  try {
    const resp = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: url,
        username: 'Bookmark',
        avatar_url: 'https://raw.githubusercontent.com/momomo-agent/momo-bookmark-extension/main/icons/webhook-avatar.png',
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    showToast('✅ 已收藏');
  } catch (e) {
    showToast('发送失败: ' + e.message, true);
  }
}

function showToast(message, isError = false) {
  const existing = document.getElementById('momo-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'momo-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isError ? '#ed4245' : '#43b581'};
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 99999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: opacity 0.3s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function getTweetUrl(tweetElement) {
  const timeLink = tweetElement.querySelector('a[href*="/status/"] time');
  if (timeLink) {
    const anchor = timeLink.closest('a');
    if (anchor) return 'https://x.com' + new URL(anchor.href).pathname;
  }
  const statusLink = tweetElement.querySelector('a[href*="/status/"]');
  if (statusLink) return 'https://x.com' + new URL(statusLink.href).pathname;
  return null;
}

function createBookmarkButton() {
  const btn = document.createElement('button');
  btn.className = 'momo-bookmark-btn';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  btn.title = 'Momo 收藏';
  return btn;
}

function injectButtons() {
  const actionBars = document.querySelectorAll('[data-testid="tweet"] [role="group"]');

  actionBars.forEach(bar => {
    if (bar.querySelector('.momo-bookmark-btn')) return;

    const tweet = bar.closest('[data-testid="tweet"]');
    if (!tweet) return;

    const btn = createBookmarkButton();
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const url = getTweetUrl(tweet);
      if (!url) {
        showToast('找不到推文链接', true);
        return;
      }

      btn.style.color = '#5865f2';
      btn.style.pointerEvents = 'none';
      await sendToBookmark(url);
      btn.style.color = '#43b581';
      setTimeout(() => {
        btn.style.color = '';
        btn.style.pointerEvents = '';
      }, 2000);
    });

    bar.appendChild(btn);
  });
}

const observer = new MutationObserver(() => injectButtons());
observer.observe(document.body, { childList: true, subtree: true });
setTimeout(injectButtons, 1000);
