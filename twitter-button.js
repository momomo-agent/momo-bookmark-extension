// twitter-button.js — 在 Twitter/X 帖子上注入收藏按钮

const STORAGE_KEY = 'momo_bookmark_config';
const DEFAULT_ENDPOINT = 'https://bookmark.momomo.dev';
const DEFAULT_API_KEY = '2a353730f2e8cd9b967f30032ec58957a9946be4cc85f975';

function getConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(STORAGE_KEY, data => {
      resolve(data[STORAGE_KEY] || {});
    });
  });
}

async function sendToBookmark(url) {
  const config = await getConfig();
  const endpoint = config.endpoint || DEFAULT_ENDPOINT;
  const apiKey = config.apiKey || DEFAULT_API_KEY;

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url }),
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
  // 从推文元素找到链接
  const timeLink = tweetElement.querySelector('a[href*="/status/"] time');
  if (timeLink) {
    const anchor = timeLink.closest('a');
    if (anchor) return 'https://x.com' + new URL(anchor.href).pathname;
  }
  // fallback: 找任何 /status/ 链接
  const statusLink = tweetElement.querySelector('a[href*="/status/"]');
  if (statusLink) return 'https://x.com' + new URL(statusLink.href).pathname;
  return null;
}

function createBookmarkButton() {
  const btn = document.createElement('button');
  btn.className = 'momo-bookmark-btn';
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  btn.title = 'Momo 收藏';
  return btn;
}

function injectButtons() {
  // 找到所有推文的操作栏（点赞、转发那一行）
  const actionBars = document.querySelectorAll('[data-testid="tweet"] [role="group"]');
  
  actionBars.forEach(bar => {
    if (bar.querySelector('.momo-bookmark-btn')) return; // 已注入

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

// 监听 DOM 变化（Twitter 是 SPA，需要持续注入）
const observer = new MutationObserver(() => {
  injectButtons();
});
observer.observe(document.body, { childList: true, subtree: true });

// 初始注入
setTimeout(injectButtons, 1000);
