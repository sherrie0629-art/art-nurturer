## 问题诊断

当前截图是**未登录用户**走的本地兜底分支（`getFallbackMbtiResult`）：

1. **性格解析** —— 不管是 INTJ 还是 ESFP，所有人都看到同一段"用自己的节奏判断局面…"的模板话，毫无个性。
2. **平行宇宙的你** —— 内容空白，因为 `fetchParallelUniverse` 第一行 `if (!user || !hasUsableUserToken(...)) return;` 直接 return，未登录就什么都不渲染（甚至连骨架屏都没有），只留下一个孤零零的标题。

## 修复方案

### 1. 让"性格解析"更有趣（`src/pages/AssessmentFlow.tsx` → `getFallbackMbtiResult`）

把固定模板换成"基于 MBTI 16 型 + 用户实际倾向比例"生成的活泼侧写：

- 新增一份 16 型本地文案表（中英双语），每条 80–120 字，第二人称、有画面感、带点幽默和网感（参考用户测题里"催婚、地铁、双 11"那种基调），不要"问卷腔"。
- 文案模板支持把用户的实际倾向比例（如"S 70%"）自然嵌进去："你身上的 N 苗头有点蹿"这种口吻，让每个人读起来都觉得"说的就是我"。
- 末尾保留一句轻量引导："登录后还有 AI 给你写一份更长的深度解读" —— 但不要再像现在这样占据整段。

### 2. 修复"平行宇宙的你"空白

未登录时不调用 edge function，改为**本地生成 16 型的平行宇宙身份**：

- 新增 `src/lib/fallbackParallelUniverse.ts`，导出 `getFallbackParallelUniverse(mbtiType, locale)`，返回 `{ magic: {role, description}, cyberpunk: {role, description} }`。
- 内置 16 型 × 2 世界（魔法 / 赛博朋克）× 中英双语的角色卡，例如 INTJ 魔法世界 = "深塔里的禁咒推演者"，赛博朋克 = "黑市算法掮客"，每张卡 30–50 字、够中二够有趣、可分享。
- 在 `fetchResult` 的 fallback 分支调用 `setParallelData(getFallbackParallelUniverse(fallback.mbtiType, locale))`，结果区直接渲染（无需骨架屏）。
- AI 分支保持原逻辑不变；只在未登录 / 401 兜底时使用本地版本。

### 3. 顺手清理

- 渲染处把当前"`parallelLoading ? Skeleton : parallelData ? 卡片 : null`"的 `null` 分支保留，避免登录用户在加载失败时仍然看到空白容器 —— 失败也回退到本地版本。

## 技术细节

- 只改 2 个文件：新建 `src/lib/fallbackParallelUniverse.ts`，编辑 `src/pages/AssessmentFlow.tsx`。
- 不动 edge function、不动数据库、不动 i18n key（继续用现有 `assessmentFlow.mbti.parallelUniverse` / `fantasyWorld` / `cyberpunk`）。
- 文案直接写在 ts 文件里（不进 i18n json），因为是 16 × 2 × 2 = 64 段，集中维护更顺手。
