# Momo Bookmark Extension

一键收藏当前页面到 Discord #bookmark 频道，Twitter/X 页面自动注入收藏按钮。

## 架构

```
Chrome 插件 → Discord Webhook → #bookmark 频道 → OpenClaw (allowBots=true) → Momo 自动收藏
```

直连 Discord Webhook，无中间层。Webhook URL 在插件设置页面配置。

### 为什么用 Webhook？

OpenClaw 过滤消息有两层：
1. `author.id === botUserId` → **永远丢弃**（防自回复循环）
2. `author.bot === true` → 受 `allowBots` 配置控制

Webhook 消息的 author.id 是 webhook 自己（不是 Momo bot），只命中第 2 层，`allowBots: true` 放行。

### 组件

| 组件 | 说明 |
|------|------|
| `popup.html/js` | 插件弹出窗口，任何页面一键收藏 |
| `twitter-button.js/css` | Twitter/X 页面注入收藏按钮（点赞/转发旁边） |
| `icons/webhook-avatar.png` | Webhook 消息头像 |

## 安装

1. 克隆仓库
2. Chrome → `chrome://extensions/` → 开发者模式 → 加载解压的扩展 → 选项目根目录
3. 点插件图标 → ⚙️ 设置 → 填入 Discord Webhook URL

### 创建 Webhook

Discord #bookmark 频道 → 右键 → 编辑频道 → 整合 → Webhook → 新建 → 复制 URL

### OpenClaw 配置

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

- **任何页面**：点击工具栏图标 → 可选备注 → 收藏
- **Twitter/X**：推文操作栏自动出现收藏图标，点击即收藏
