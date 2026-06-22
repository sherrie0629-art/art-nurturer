
## 目标

把"生成金句卡片"的触发方式做成一致、可发现、不误触，并支持基于"选中文本"生成。

## 当前逻辑梳理

文件：`src/pages/Chat.tsx`（AI 消息气泡）+ `src/hooks/useQuoteCard.ts`

- 移动端：`onTouchStart` → 600ms 定时器 → 触发。`onTouchEnd / onTouchCancel` 清掉定时器。
- PC 端：`onContextMenu`（右键）→ 阻止默认菜单 → 直接触发。
- 卡片文字：始终是 `msg.content.slice(0, 200)`，与文本选择无关。

### 问题

1. 手机"轻划即出"：缺少 `onTouchMove` 取消，滑动滚动时只要 600ms 内不抬手就触发。
2. PC 右键无提示：用户根本不知道这个入口。
3. 文字不是"选中的"：是整段前 200 字，与用户预期不符。
4. 没有可视化反馈：长按过程中无任何 UI 提示。

## 优化方案

### 1. 触发方式统一为"按钮 + 长按"双入口

- **移动端**：保留长按，但
  - 加 `onTouchMove`：移动距离 > 10px 立刻取消（避免滚动误触）。
  - 长按阈值从 600ms → 500ms，长按成功时轻震动 + 气泡微缩动画。
- **PC 端**：去掉"右键触发"（保留浏览器原生右键菜单，方便复制）。改为：鼠标 hover 到 AI 气泡时，右下角浮出小图标按钮（卡片图标 + tooltip "生成金句卡片"），点击即触发。
- 移动端在气泡尾部也加一个常驻的小图标按钮，作为长按的替代入口（可发现性）。

### 2. 文字来源支持"选中文本"优先

触发时按顺序取文字：

```text
1. window.getSelection() 是否落在这条消息内 → 用选中片段
2. 否则 → 用整条 msg.content（截断到 200 字）
```

提示文案在 toast 里区分："正在生成金句卡片…（已选中片段）" / "…（整段）"。

### 3. 卡片字数与排版

- 选中文本上限放到 300 字；超出在卡片底部加 "…" 省略号。
- 选中很短（< 6 字）时 toast 提示"选中内容太短，使用整段"，回退到整段逻辑。

### 4. 微交互

- 长按到一半时，气泡边框出现金色进度环（CSS `conic-gradient` 动画），到 100% 触发，给用户"还能取消"的余地。
- 触发瞬间气泡轻闪一下金色高光。

## 涉及文件

- `src/pages/Chat.tsx`：
  - 重写 `handleLongPressStart / End`，加入 `onTouchMove` 取消、selection 读取。
  - 移除 `onContextMenu` 绑定。
  - 在 AI 气泡右下角加 hover/常驻的"生成卡片"图标按钮。
  - 加入长按进度环 UI。
- `src/hooks/useQuoteCard.ts`：增加 `maxChars` 参数（默认 200，选中模式 300）。
- `src/i18n/locales/zh.json` / `en.json`：新增 `chat.quoteCardFromSelection`、`chat.selectionTooShort`、`chat.quoteCardTooltip` 等文案。

## 技术细节

```ts
// 取选中文本（必须落在当前消息节点内）
function getSelectionInMessage(msgEl: HTMLElement): string | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!msgEl.contains(range.commonAncestorContainer)) return null;
  const text = sel.toString().trim();
  return text.length >= 6 ? text : null;
}

// onTouchMove 取消
const startPos = useRef<{x:number;y:number}|null>(null);
onTouchStart(e) { startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; startTimer(); }
onTouchMove(e) {
  const dx = e.touches[0].clientX - startPos.current!.x;
  const dy = e.touches[0].clientY - startPos.current!.y;
  if (Math.hypot(dx, dy) > 10) cancelTimer();
}
```

## 不做的事

- 不改卡片画布的视觉设计（背景、字体、布局保持现状）。
- 不改后端、不动数据库。
- 不增加新的分享渠道。

