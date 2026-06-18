## 现状说明

目前未登录状态下的聊天内容**完全没有保存**：

- `src/pages/Chat.tsx` 里只有登录用户才会创建 `conversations` 记录、写入 `chat_messages`（见 `createConversation` 和保存逻辑都带 `if (!user) return`）。
- 未登录时 `messages` 只存在 React 组件 state 里，一刷新就丢，登录后也不会被搬到账号下。
- 也就是说：你之前未登录的聊天，技术上是真的找不回来了，数据库里没有任何记录。抱歉。

## 目标

1. 未登录聊天能在**当前浏览器**里保留（刷新不丢）。
2. 用户在同一浏览器登录后，把这些"游客聊天"**自动迁移**到账号下，变成正式的 `conversations` + `chat_messages`，之后跨设备可见。
3. 不破坏现有已登录用户的逻辑。

## 实施方案

### 1. 未登录草稿持久化（localStorage）

- 在 `src/pages/Chat.tsx`：未登录时把每个 agent 的消息存到 `localStorage`，key 形如 `guestChat:v1:<agentId>`，结构 `{ messages: Message[], updatedAt }`。
- 进入 `/chat?agent=xxx` 时，如果未登录且没有 `conversationId`，从 localStorage 恢复 messages（替换现在的空数组初始化）。
- 每次 `setMessages` 之后（已登录用户不写），把最新数组同步进 localStorage。
- 为防滥用，单 agent 草稿上限例如 200 条，超出时丢最旧。
- 仍然保留现有 `anonLimitPrompt` 的免费额度逻辑，不放宽限制。

### 2. 登录后迁移到账号

- 新增一个轻量模块 `src/lib/migrateGuestChats.ts`，导出 `migrateGuestChatsToAccount(userId)`：
  - 扫描所有 `guestChat:v1:*` key。
  - 对每个非空 agent 草稿：
    - `insert` 一条 `conversations`（`user_id`, `agent_id`, `title` 用首条用户消息截断或默认 `Chat with <agent>`）。
    - 把消息批量 `insert` 进 `chat_messages`（保留 role/content/原始顺序；created_at 用草稿里的时间，没有就 now()）。
  - 全部成功后删除对应 localStorage key；失败的保留并 `console.error`，不阻塞登录。
- 在 `AuthContext` 的 `onAuthStateChange` 里：当 `event === "SIGNED_IN"` 且 session 由匿名变成已登录时，调用上面这个迁移函数。完成后用 `sonner` toast 提示"已同步未登录时的聊天到你的账号"。
- 当前 `/chat` 页面如果正打开对应 agent，迁移完成后需要把本地的 `conversationId` 接上新创建的 `conversations.id`，这样后续发的消息会续写到同一条会话里。做法：迁移函数返回 `Record<agentId, conversationId>`，`Chat.tsx` 监听 `user` 变化，如果命中当前 agent 就 `setConversationId(newId)`。

### 3. 边界与提醒

- 未登录 UI 顶部加一行小提示：`未登录的聊天只保存在当前浏览器，登录后会自动同步到账号`。文案放到 `zh.json` / `en.json`。
- 清除浏览器数据 / 换设备 / 隐身模式仍然会丢，这是 localStorage 的固有限制，提示里说明。
- 迁移只在"匿名 → 登录"瞬间触发一次，避免重复导入：用 `SIGNED_IN` 事件 + 迁移成功后立即清 key 即可，不需要额外标记。

## 涉及文件

- 编辑：`src/pages/Chat.tsx`、`src/contexts/AuthContext.tsx`、`src/i18n/locales/zh.json`、`src/i18n/locales/en.json`
- 新建：`src/lib/migrateGuestChats.ts`
- 无数据库迁移：复用现有 `conversations` / `chat_messages` 表与 RLS。

## 关于你已经丢失的聊天

数据库里没有未登录的历史记录，无法找回。这个方案只能保证**今后**未登录的聊天不再丢。
