## 目标

把"灵魂镜像"从聊天页打开时，**只生成当前角色的镜像海报**，并在海报里加一张符合该角色风格的 AI 配图；同时把单角色海报排版做得更呼吸。
Vault 页面入口（4 位 AI 联合镜像）保持现有逻辑不动。

## 方案

### 1. 入口区分：单角色 vs 全员

在 `SoulMirrorDialog` 加 `singleAgentId?: string` 属性：

- `Chat.tsx` 把 `agentId` 透传给 Dialog。
- `Vault.tsx` 不传，保留 4 位联合视图。
- Dialog 内根据 `singleAgentId` 决定：
  - 介绍页只展示该角色一张大卡（不再 4 宫格）。
  - 调用 edge function 时带上 `{ agentId }`，并把节流键改成"按角色"。
  - 渲染海报时走"单角色版式"（见 3）。

### 2. Edge function `generate-soul-mirror` 支持单角色模式

- 接受 `body.agentId`。若指定且合法（4 个角色之一）：
  - 仅对该角色调 AI 生成 `portrait/signature/keywords`，跳过其他 3 个的 AI 调用，节省 75% 时长 / 配额。
  - 节流改为 per-(user, agentId)：扫描 `soul_mirrors` 时按 `user_snapshot->>singleAgentId = ?` 过滤，24h 内同一角色不能重复生成；不同角色互不冲突。
  - **新增角色风格配图**：调用 AI Gateway `/v1/images/generations`（非流式、`openai/gpt-image-2`、`quality: "low"`、`size: "1024x1536"` 竖图），prompt 模板按角色硬编码：
    - 暖暖：温暖橘调、毛线/茶光、室内柔光，类似日系暖调插画。
    - 老王：青灰水墨、茶汤、苔石，沉静水墨风。
    - 云生：深蓝紫夜空、月相、星座线条，神秘魔幻插画。
    - 星轨：霓虹紫粉、星轨、轻赛博梦核风。
    - prompt 末尾固定追加："no text, no letters, vertical portrait composition, soft cinematic lighting"。
    - 失败时跳过图片，仍正常返回文字。
  - 把生成的 PNG 上传到 `shared-posters` storage（命名 `soul-mirror-img_<id>.png`），URL 写进返回体 `imageUrl` 字段，并存进 `user_snapshot.singleAgentId` / `user_snapshot.imageUrl`。

返回体扩展：
```json
{
  "id": "...",
  "perspectives": [<just-one>],
  "userSnapshot": { ..., "singleAgentId": "nuannuan", "imageUrl": "https://.../..." }
}
```

### 3. 海报版式（单角色专属）`renderPoster`

如果 `snap.singleAgentId` 存在：
- 上半部分：左侧 360×480 角色配图（圆角，若加载失败就用纯渐变色占位）；右侧角色名 + emoji + 一句 signature。
- 中部：一条细分割线 + portrait 正文（字号比现在大、行高更松、最多 6–7 行，超出截断）。
- 底部：3 个 keyword chip 一排居中。
- 完全不画那 3 个副卡片。
- 标题保留 "Soul Mirror · 灵魂镜像"，副标题改成 `与 暖暖 第 N 轮深聊后的镜像片段`。

整体留白比当前明显加大，看上去不再密密麻麻。

### 4. Dialog 介绍 / 结果文案

- 单角色模式时，介绍区改成只展示当前角色一行（emoji + 名 + 一句描述），CTA 文案：「让 ${agentName} 写一张你的镜像」。
- 节流提示改成「${agentName} 24 小时内只能生成一次」。

## 技术细节

涉及文件：

- `src/components/SoulMirrorDialog.tsx`：新增 `singleAgentId` prop；介绍页分支；`renderPoster` 加单角色分支；用 `Image()` 预加载 `userSnapshot.imageUrl` 后再 `ctx.drawImage`（CORS：storage 桶已 public，需 `crossOrigin = "anonymous"`）。
- `src/hooks/useSoulMirror.ts`：`generate(agentId?)` 透传到 edge function；`SoulMirrorSnapshot` 加 `singleAgentId?: string; imageUrl?: string;`。
- `src/pages/Chat.tsx`：`<SoulMirrorDialog singleAgentId={agentId} ... />`。
- `supabase/functions/generate-soul-mirror/index.ts`：支持 `agentId`，单角色 AI 调用 + 单角色图片生成 + per-agent 节流。
- 不动 Vault.tsx、不改数据库 schema（`user_snapshot` 是 jsonb，直接塞新字段即可）。

注意事项：

- AI Gateway 图片生成可能失败/超时 → 包 try/catch，失败时 `imageUrl = null`，前端拿不到就走纯色占位，不阻塞主流程。
- 图片 1024×1536 base64 可能较大（≈1MB），上传后只在 jsonb 存 URL 不存 base64。
- 节流：单角色之间互相独立；全员模式（无 agentId）仍用原 24h 全局节流。
