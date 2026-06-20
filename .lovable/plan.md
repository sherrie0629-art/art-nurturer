## 设计目标

把 `src/components/FortuneRippleScene.tsx` 中央的"静水涟漪"整体替换为**一柄半开的折扇**，扇面绘有梅花花瓣。待机时扇面轻轻呼吸；触发抽签时花瓣脱离扇面、缓缓飘落，落幕之际中央浮现签文标签。

## 视觉构成（纯 SVG + CSS，无图片依赖）

1. **折扇主体**（SVG，约 220×140）
   - 11 根扇骨：深木色 `#3a2418` 渐变到顶端淡金 `#d4af37`，从中心轴呈 160° 展开
   - 扇面：宣纸质感渐变 `#f5ecd9 → #e8d9b8`，叠一层 5% 不透明墨色噪点
   - 扇面边缘描金 1px 线，底部扇轴一颗 `#d4af37` 金钉 + 一缕朱红流苏
   - 扇面上手绘 3 朵梅花（5 瓣，淡粉 `#e8a4a4` 描深红边）静止贴在扇面上

2. **待机动效**
   - 整柄扇子 `transform-origin: bottom center`，以 6s 周期 ±1.5° 微摆
   - 金钉处一圈极弱光晕呼吸（opacity 0.4 → 0.7）

3. **抽签触发动效**（外部 prop `isDrawing` 控制）
   - 扇面上的梅花花瓣逐片脱离（共 12–15 瓣），各自带不同 delay (0–1.2s)、duration (2.5–3.5s)、horizontal drift (±60px)、rotation (180–540°)
   - 同时扇子微微合拢 5°、整体淡出至 0.35 opacity
   - 1.2s 后中央浮现签文卡（已存在的"心定则签现"位置）：缩放 0.9→1 + 透明度 0→1

4. **下方文字**
   - 保留"静心求签 / Draw your fortune"两行 label，仅替换为思源宋体 + 细金色分隔线

## 涉及文件

- 改写 `src/components/FortuneRippleScene.tsx`：
  - 删除现有同心圆 / 花瓣 / "静水"标签节点
  - 新增 `<FoldingFan />` 子组件（内联 SVG）+ `<FallingPetals count={14} active={isDrawing} />`
  - 接受现有 props（`isDrawing` 或同等触发态），保持外部 API 不变
- 在同文件底部新增 `<style>` 段或追加 `src/index.css` 中的 keyframes：`fan-breathe`、`petal-fall-{i}`、`label-reveal`
- 不改业务逻辑、不改父组件调用方式

## 验证

- 待机：扇子静态优雅、轻微摆动
- 点击抽签：花瓣逐片飘落 → 签文浮现
- 暗色卡片背景、尺寸与原组件一致，移动端不溢出
