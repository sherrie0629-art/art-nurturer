## 签诗卡片美化方案

目标：把当前略显"素"的签诗灰色卡片，做成有东方禅意、有质感的"签纸"，仅改 `src/pages/DailyFortuneStick.tsx` 中 result 区块的签诗卡部分（不动业务逻辑）。

### 视觉设计

1. **签纸质感背景**
   - 改为深色宣纸 / 古卷轴渐变：暗酒红 → 暗琥珀 → 暗墨色（dark mode 友好），叠加一层 noise/纸纹（CSS `radial-gradient` + `mix-blend-overlay`）。
   - 卡片四角加细金色装饰角线（用伪元素 `::before/::after` 画 L 形金线）。
   - 上下加一道烫金细描边 + 内嵌阴影，模拟签纸的厚度。

2. **签诗排版（核心）**
   - 字体换成更具古意的衬线：使用 `font-display`（项目已有）+ fallback `"Noto Serif SC", "STKaiti", serif`，并将每句作为竖向"垂直签条"也可，但优先保留横排、字距加宽 (`tracking-[0.25em]`)、行高放松 (`leading-[2.4]`)。
   - 每句签诗居中，逐行 `motion` 渐入（stagger 0.15s），有"墨字浮现"的感觉。
   - 文字颜色：暖金 `#E8C77A` → `#F5E6B8` 的渐变文字（`bg-clip-text`），并加细微 `text-shadow` 模拟烫金。

3. **"签诗"标签**
   - 改为竖排印章风格：放在卡片右上角，朱红方框 + 白色"签诗"二字，模拟印泥。
   - 左上保留小字「第 N 签 · 等级」作为副标。

4. **装饰元素**
   - 卡片中央顶部加一枚淡淡的"☯ / 太极 / 简化云纹" SVG 水印（opacity 0.06），增加文化氛围。
   - 底部加一行小篆/小字落款："—— 心灵密语 · 灵签"。

5. **同步轻量优化**
   - "签头"卡片：emoji 容器加金色描边光晕，签等 badge 改为带渐变描边的"印章感"标签。
   - "现代解签"卡片：标题前加一条短金色竖条 `before:` 装饰，与签诗卡风格呼应。

### 技术细节

- 仅改动文件：`src/pages/DailyFortuneStick.tsx`
- 新增样式通过 Tailwind utility + 少量 inline style（渐变 / text-shadow）实现，无需改 `index.css` 或 tailwind 配置。
- 装饰图形用内联 SVG，无新增资源文件。
- 保留所有现有 state、动画 state、按钮逻辑、i18n 调用不变。
- Dark / Light 模式都验证一遍颜色对比度（金字在深底、深字在浅底切换通过 `dark:` 前缀）。

### 不做的事

- 不改抽签逻辑、Edge Function、数据库结构。
- 不替换 emoji 体系、不改文案。
- 不引入新字体包（用系统已有 + 衬线 fallback）。
