# Momo Bookmark Extension

一键收藏当前页面到 Discord #bookmark 频道，Twitter/X 页面自动注入收藏按钮。

## 架构

```
Chrome 插件 → Cloudflare Worker (bookmark.momomo.dev) → Discord Webhook → #bookmark 频道 → OpenClaw (allowBots=true) → Momo 自动收藏
```

### 为什么用 Webhook 而不是 Bot Token？

OpenClaw 的消息处理有两层过滤：
1. **Bot 自身消息**（`author.id === botUserId`）→ **永远丢弃**，任何配置都管不了
2. **其他 Bot 消息**（`author.bot === true`）→ 受 `allowBots` 配置控制

如果用 Momo 的 bot token 发消息，author.id 就是 Momo 自己，会被第 1 层过滤。
Webhook 消息的 author.id 是 webhook 自己（不是 Momo），只会被第 2 层过滤，`allowBots: true` 可以放行。

### 组件

| 组件 | 说明 |
|------|------|
| `popup.html/js` | 插件弹出窗口，任何页面一键收藏 |
| `twitter-button.js/css` | Twitter/X 页面注入收藏按钮（在点赞/转发旁边） |
| `worker/index.js` | Cloudflare Worker，接收请求 → 调 Discord Webhook |
| `manifest.json` | Chrome Manifest V3 配置 |

### Secrets（Worker 环境变量）

| 变量 | 说明 |
|------|------|
| `WEBHOOK_URL` | Discord #bookmark 频道的 Webhook URL |
| `API_KEY` | 插件认证密钥 |

## 安装

### Chrome 插件
1. 克隆仓库
2. Chrome → `chrome://extensions/` → 开发者模式 → 加载解压的扩展 → 选项目根目录
3. 默认配置已内置，开箱即用

### Worker 部署
```bash
cd worker
npx wrangler deploy
# 设置 secrets
echo "<webhook-url>" | npx wrangler secret put WEBHOOK_URL
echo "<api-key>" | npx wrangler secret put API_KEY
```

## OpenClaw 配置

`~/.openclaw/openclaw.json` 中需要开启 `allowBots`：

```json
{
  "channels": {
    "discord": {
      "allowBots": true
    }
  }
}
```

## 使用

- **任何页面**：点击浏览器工具栏的 Momo Bookmark 图标 → 可选添加备注 → 收藏
- **Twitter/X**：每条推文的操作栏（点赞/转发旁边）会自动出现收藏图标，点击即收藏
