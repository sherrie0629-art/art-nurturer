## 问题定位

`src/pages/DailyFortuneStick.tsx` 第 367 行的"找星轨细聊"按钮，确实通过 `navigate("/chat?agent=xinggui", { state: { fortuneStick: {...} } })` 把签诗结果传过去了。

但是 `src/pages/Chat.tsx` 里**完全没有读取 `location.state.fortuneStick`**。它目前只识别这六种 result：`mbtiResult`、`emotionResult`、`enneagramResult`、`zodiacResult`、`tarotResult`、`compatibilityResult`。因此求签结果到了 Chat 页就被丢弃 —— 既不会进系统提示，也不会触发首条自动消息（你看到的是普通的"我的太阳/月亮/上升 是…"默认欢迎气泡）。

我顺手检查了所有同类跳转入口：
- `AssessmentFlow`（MBTI）、`EnneagramFlow`、`ZodiacFlow`、`EmotionFlow`、`CompatibilityFlow`、`DailyTarot` —— 它们传的 state key 都在 Chat 里有对应处理，**没有同样的问题**。
- 这次的 bug 是新增"每日求签"时只补了发送端、没补接收端。

## 改动方案（仅修改 `src/pages/Chat.tsx`）

1. **解析 state**：新增
   ```ts
   const fortuneStickResult = (location.state as any)?.fortuneStick as {
     stickNumber: number; level: string; title: string;
     poem: string; interpretation: string; actionTip?: string;
   } | undefined;
   ```

2. **纳入上下文判断**：把 `fortuneStickResult` 加入 `hasAssessmentContext` 的 `||` 列表，确保系统提示里的"刚完成测评"分支会被触发。

3. **拼系统提示片段**：在已有的 `if (tarotResult) { … }` 块后追加
   ```ts
   if (fortuneStickResult) {
     contextLine += isZh
       ? `[刚刚求签] 用户在每日灵签中抽到第 ${f.stickNumber} 签「${f.title}」（${f.level}）。签诗：${f.poem}。解签：${f.interpretation}${f.actionTip ? `。今日小行动：${f.actionTip}` : ""}`
       : `…`;
   }
   ```
   （沿用现有变量名 `contextLine` / `s`，与上面 5 个分支保持一致。）

4. **自动首条消息**：仿照 `tarotAutoSentRef` 增加 `fortuneStickAutoSentRef`，在 `historyLoaded && user` 后自动发送一条用户消息，例如：
   > "星轨，我今天求到第 7 签『春风得意』（上签）。这签到底在跟我说啥呀？🍃"
   英文版同样按现有风格补一份（虽然项目已强制中文，但保持双语模式与其他 result 一致，避免回归）。

5. **不动任何其他文件**：发送端 `DailyFortuneStick.tsx` 当前 payload 字段已够用，无需改动。Edge Function / DB / i18n 也不涉及。

## 验证

- 完成一次每日抽签 → 点击"找星轨细聊" → 应看到 Chat 自动以求签结果开场，星轨回复时会引用签号、等级、签诗。
- 直接进入 `/chat?agent=xinggui`（无 state）→ 行为与现在一致，仍走默认欢迎。
- 其他入口（MBTI / 九型 / 星座 / 情绪 / 配对 / 塔罗）回归不受影响。
