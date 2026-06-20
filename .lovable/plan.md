## 目标
在 `/admin` 用户管理列表中，为每个用户增加"禁用 / 解禁"按钮。被禁用的用户无法登录，也无法继续调用聊天、测评、深度报告等消耗成本的接口。

## 实现方案

### 1. 数据层（迁移）
在 `public.profiles` 表新增字段：
- `is_banned boolean not null default false`
- `banned_at timestamptz`
- `banned_reason text`（可选，先做空字段，后续可填）

通过 `has_role(auth.uid(), 'admin')` 让管理员可以更新所有 profile 的封禁字段；普通用户保持现状（只能读写自己）。

### 2. 后端拦截（成本守门）
在所有消耗 LOVABLE_API_KEY / ElevenLabs 的 Edge Function 入口加一道统一检查：拿到 JWT 中的 user_id → 查 `profiles.is_banned` → 若为 true，立刻返回 `403 { error: "account_banned" }`，不走 AI 调用。

需要打补丁的函数（按"会花钱"清单）：
- `chat`
- `chat-tarot-draw`、`tarot-draw`、`daily-fortune-stick`
- `assessment`、`assessment-emotion`、`assessment-enneagram`、`assessment-zodiac`、`assessment-compatibility`
- `generate-deep-report`、`generate-soul-fragment`、`generate-soul-mirror`、`generate-poster-image`
- `extract-memory-incremental`、`recall-memory`、`summarize-conversation`
- `tts-speak`

做法：新建 `supabase/functions/_shared/ban-check.ts`，导出 `assertNotBanned(req)`，每个函数在 CORS 之后、业务逻辑之前调用一次。失败返回带 CORS 头的 403。

### 3. 强制登出已封禁用户
- 新增 Edge Function `admin-ban-user`（service_role）：校验调用者是 admin，然后
  1. `UPDATE profiles SET is_banned = $1, banned_at = ...`
  2. 当封禁时，调用 `admin.auth.admin.signOut(user_id, 'global')` 让现存 session 全部失效。
- 前端 `AuthContext` 监听到 session 失效时已经会跳登录页，无需额外改动。

### 4. 前端（Admin 页面）
在 `src/pages/Admin.tsx` 的 users tab 中：
- `loadUsers` 一并拉取 `profiles.is_banned`
- 每个用户卡片右上角显示状态徽章：正常 / 已禁用（红色）
- 在"管理订阅"按钮旁加一个按钮：
  - 未禁用 → `禁用此用户`（红色 ghost 样式，点击二次确认）
  - 已禁用 → `解除禁用`
- 点击后调用 `supabase.functions.invoke("admin-ban-user", { body: { user_id, banned: true/false } })`，成功后 toast 并 `loadUsers()` 刷新。
- 被禁用的用户卡片整体降低透明度，便于一眼识别。

### 5. 文案
中文为主，新增 i18n key（`admin.banUser` / `admin.unbanUser` / `admin.banned` / `admin.confirmBan` / `admin.bannedToast`），同步英文兜底。

## 技术细节
- 迁移使用 `ALTER TABLE public.profiles ADD COLUMN ...`，无需 GRANT（profiles 已有授权）。
- 封禁检查函数读取 profiles 时使用 service role client，避免被 RLS 影响。
- 不删除用户数据，仅打标 + 全局登出，随时可恢复。
- 管理员账户自身不允许被禁（接口内校验 `target !== caller && !has_role(target,'admin')`，避免误操作锁死后台）。

## 验收
1. 在 Admin → 用户 中对一个测试账号点"禁用此用户"，徽章变为"已禁用"。
2. 该账号若在线，下次任意请求被踢回登录页；登录后调用 chat 接口直接 403，不消耗 AI 额度。
3. 解除禁用后恢复正常。
