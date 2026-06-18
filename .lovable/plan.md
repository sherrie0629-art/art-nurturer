## 目标
1. 灵魂镜像入口 + 海报的四位角色统一成新版：暖暖 / 老王 / 云生 / 星轨（后端已经是新的，前端在拖后腿）。
2. 让生成结果"对得上你实际的聊天进度"：聊得最深的那位放成 C 位主格，未聊过的明确写成「远观初见」的口吻，不假装认识你。

---

## 第一部分：修正角色名（前端对齐后端）

### `src/components/SoulMirrorDialog.tsx`
- 入口四张小卡改成：
  - 🧵 暖暖 — 看见你安静的那一面
  - 🍵 老王 — 看见你硬撑的那一面
  - 🌙 云生 — 看见你命运的底色
  - ✨ 星轨 — 看见你最闪光的那一面
- `AGENT_BG` 的 key 从旧 `barista/jax/mystic/bestie` 换成 `nuannuan/laowang/yunsheng/xinggui`，配色对应：
  - nuannuan：暖橘 `#5a3a2a → #d49a6a`
  - laowang：墨绿茶汤 `#2a3a2e → #6a8a5a`
  - yunsheng：夜空青 `#1e2a4a → #5a7ab8`
  - xinggui：星紫 `#3a2a5a → #b07ad9`

### `src/i18n/locales/zh.json` & `en.json`
- `soulMirror.lens.*`：四个 key 改名为 `nuannuan / laowang / yunsheng / xinggui`，文案改成上面的中文/英文版本。
- `soulMirror.generatingDesc`：「暖暖、老王、云生、星轨 正同时落笔，约需 10-15 秒。」英文同步。
- 检查 748 / 754 / 757 行那处旧名（看起来在另一个枚举/列表里），改成新四位。

---

## 第二部分：让海报"对得上聊天进度"

### 后端 `supabase/functions/generate-soul-mirror/index.ts`
- 已经在 prompt 里传了 `bondLevel` 和 `totalTurns`，但只在 turns<6 时塞了一句英文 fallbackNote。要替换成"分档口吻指令"，直接以中文/英文写进 system prompt：
  - `totalTurns === 0`：明确告诉模型「你和 TA **从未对话过**。请用『远观初见』的口吻：基于 MBTI / 星座 / 跨角色 facts 写一段坦诚的第一印象，开头自然带出『我们还没正式说过话，但远远看你……』之类的语气，不要编造共同记忆。signature 用『初见』感的句子。」
  - `1 ≤ totalTurns < 6`：「我们只浅浅聊过几次，写一段克制、留白的观察。」
  - `totalTurns ≥ 6`：当前正常的"熟人视角"。
- 在返回的每个 `Perspective` 里新增字段 `tier: "unmet" | "glimpse" | "known"`，给前端区分渲染。
- 选 C 位：取所有 perspective 中 `totalTurns` 最大的那一位（并列时优先有 memories 的），返回时新增 `primaryAgentId` 字段。若所有人 totalTurns 都是 0，则 `primaryAgentId = null`，海报回退成对称四宫格。

### 前端海报 `renderPoster` 重做布局
- 拿到 `primaryAgentId` 后切两种布局：
  - **主格布局**（C 位存在）：上方一个大卡片（约 60% 高度）渲染主格 agent，下方三张小卡片横排副格。主格字体更大、portrait 显示更多行、加一圈高光描边、右上角小标「最懂你的那一位 · 已对话 N 轮」。
  - **对称布局**（无 C 位 / 所有人都没聊过）：保留现在的 2x2 四宫格。
- 每张副格在右上角加角标：
  - `tier=known` → 不显示角标
  - `tier=glimpse` → 灰底小字「浅浅聊过」
  - `tier=unmet` → 灰底小字「远观初见」+ 卡片整体不透明度 0.85，让"未相遇"感觉一眼能识别。
- 主标题副行加一句动态文案：「与暖暖深聊 N 次后的灵魂镜像」/ 全部未聊则「四位 AI 对你的第一印象」。

### 前端类型 `src/hooks/useSoulMirror.ts`
- `SoulMirrorPerspective` 加可选 `tier?: "unmet" | "glimpse" | "known"`。
- `SoulMirror` / 返回类型加可选 `primary_agent_id?: string | null`（数据库 `perspectives` 是 JSON，无需迁移；`primaryAgentId` 一并存进 `user_snapshot` 字段，避免改表）。

### `src/components/SoulMirrorDialog.tsx` 入口提示
- 在入口卡片底部按聊天进度加一行小灰字：
  - 全都没聊过：「你还没和这四位中的任何一位认真聊过，海报会偏『初印象』。」
  - 只聊过 1 位：「目前只和 {name} 聊得多，其他三位的部分会是『远观初见』。」
  - ≥2 位：不显示。
- 这句话靠 `agent_bonds` 表查 `total_turns`（已在 `useAgentBonds` 之类的 hook 里，复用即可；若没有现成 hook 就在 Dialog 打开时单独查一次）。

---

## 不动的部分
- 数据库 schema、RLS、配额（每 24h 一次）、订阅逻辑保持不变。
- 后端 `AGENTS` 顺序保持 暖暖 → 老王 → 云生 → 星轨，海报副格按这个顺序渲染（如果主格抽掉，剩下三位按原顺序）。
