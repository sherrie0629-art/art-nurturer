# 测评内容本土化改造方案

## 一、现状盘点

目前项目内共 6 个测评/占卜入口（前端 + 边缘函数 + i18n + 数据表）：


| 模块                 | 文化背景         | 入口                        | 边缘函数                          |
| ------------------ | ------------ | ------------------------- | ----------------------------- |
| MBTI 性格测评          | 西方心理学        | /assessment/mbti          | assessment                    |
| 九型人格 Enneagram     | 西方/苏菲派       | /assessment/enneagram     | assessment-enneagram          |
| 星座运势 Zodiac        | 西方占星         | /assessment/zodiac        | assessment-zodiac             |
| 心灵体检 Emotion       | 通用心理学        | /assessment/emotion       | assessment-emotion            |
| 缘分配对 Compatibility | 混合（含星座/MBTI） | /assessment/compatibility | assessment-compatibility      |
| 每日塔罗 Daily Tarot   | 西方神秘学        | /daily-tarot, Chat 内抽牌    | tarot-draw, chat-tarot-draw 等 |


## 二、改造原则

- **保留有普世心理学价值的**：MBTI、九型人格、心灵体检 —— 国内用户也普遍熟悉，只调整文案/场景到本土语境（职场、家庭、相亲、考公等）。
- **替换西方神秘学体系**：塔罗 → 周易卦象；西方星座 → 中国传统命理（八字/生肖/紫微）。
- **新增本土特色**：增加一两个具有中国文化辨识度的题目，让"算命"味更浓但保持心理学外壳。

## 三、最终模块矩阵（建议）


| 类别     | 模块                       | 处理方式  | 说明                                          |
| ------ | ------------------------ | ----- | ------------------------------------------- |
| 心理学测评  | MBTI 性格测评                | 保留+改写 | 10 个场景改为中国职场/家庭/社交语境（如"老板让你周末加班"）           |
| 心理学测评  | 九型人格                     | 保留+改写 | 案例本土化（婆媳关系、同事内卷、原生家庭）                       |
| 心理学测评  | 心灵体检（倦怠）                 | 保留+改写 | 维度文案改成"内卷指数 / 班味浓度 / 精神 emo 度 / 睡眠"         |
| 命理/玄学  | 星座运势 → **生肖运势 + 紫微星盘**   | 替换    | 输入出生年份（生肖）+ 月份，AI 输出本周/本月运势、宜忌、幸运色/方位/数字    |
| 命理/玄学  | 每日塔罗 → **每日一卦（周易六十四卦）**  | 替换    | 模拟"摇卦"动画（三枚铜钱六次），抽出本卦+变卦，AI 解卦              |
| 命理/玄学  | 缘分配对 → **姻缘合盘（八字/生肖合婚）** | 替换    | 输入双方生肖+MBTI，AI 给出"天作之合 / 相生相克 / 化解建议"       |
| 新增（可选） | **每日一签**                 | 新增    | 进入首页时可"求签"，108 签文，AI 结合用户近期对话给出解读（替代每日塔罗位置） |


> 备注：八字（年月日时四柱）相对复杂，且需要出生时辰，国内用户接受度高但首次输入门槛大。建议**一期先用"生肖+月份"轻量化命理**，二期再考虑完整八字。

## 四、各模块文案改造要点

### 1. MBTI（保留，重写场景题）

- 场景示例：年终聚餐被点唱、相亲对象迟到 20 分钟、家族群里被催婚、公司团建爬山。
- "平行宇宙的你"两选项：仙侠世界 / 赛博朋克 → **修仙界的你 / 民国的你**。

### 2. 九型人格（保留，重写题干）

- 内核机制不变（核心恐惧/欲望/侧翼），案例改为本土：原生家庭、内卷、KPI、躺平 vs 卷。
- 老板角色"咖啡师"已替换为新角色（云生/老王等），文案同步。

### 3. 心灵体检 → 维度本土化

- burnout → "**班味浓度**"
- energy → "**元气值**"
- boundaries → "**边界感**"
- sleep → "**回血质量**"
- 行动方案文案加入"周末躺平 / 公园 20 分钟 / 寺庙上香"等本土场景。

### 4. 生肖紫微运势（替换星座运势）//这里不做替换。星座运势在中国大陆的年轻人里也很受欢迎。

- Intro：选择生肖（12 选 1）+ 出生月份。
- AI 输出字段保持兼容：`reading / luckyColor / luckyNumber / luckyDirection / mantra / doThis / avoidThis / ritual`。
- 文案风格："本周三合贵人临门""忌口舌之争""宜东南方向出行"。
- 复用现有 `assessment-zodiac` 边缘函数，仅替换 prompt 与 i18n，前端字段不动。

### 5. 每日一卦（替换塔罗）

- 视觉：三枚铜钱抛掷 6 次动画（替代洗牌），生成本卦+变卦。
- 数据：内置 64 卦元数据（卦名/卦辞/象辞/通俗解），文件 `src/data/iChingHexagrams.ts` 替代 `tarotCards.ts`。
- AI 解读：结合用户当下提问（聊天内）或当日心情（每日一卦页）给出"事业/感情/财运/健康"四象。
- 受影响代码：
  - `src/pages/DailyTarot.tsx` → `DailyHexagram.tsx`
  - `src/components/TarotCardInline.tsx` → `HexagramInline.tsx`
  - 边缘函数 `tarot-draw / tarot-draw-status / chat-tarot-draw / prefill-tarot-cards` → 对应 `hexagram-*` 系列
  - i18n 全量替换"塔罗 → 卦象"
  - 数据库表（如有 `tarot_draws`）需迁移或新增 `hexagram_draws`

### 6. 姻缘合盘（替换缘分配对）//这里不做替换，保留现有的姻缘合盘。

- 输入：双方姓名、生肖、MBTI（可选）、星座改为生肖。
- AI 输出："姻缘指数 / 三合六合 / 相冲相害 / 化解之道 / 适合相处方式"。
- 边缘函数 `assessment-compatibility` 复用，重写 prompt。

### 7. 每日一签（新增，可选 P1）

- 首页"每日塔罗"卡位 → "今日求签"。
- 108 签内容（观音灵签风格但去宗教化），AI 二次解读。

## 五、技术变更清单

### 前端

- 路由：`/daily-tarot` → `/daily-hexagram`；`/assessment/compatibility` 保留路径但页面重写。
- 组件重命名：`TarotCardInline` → `HexagramInline`；新增"摇卦动画"组件。
- 数据：新增 `src/data/iChingHexagrams.ts`（64 卦）、`src/data/zodiacAnimals.ts`（12 生肖）、可选 `src/data/fortuneSticks.ts`（108 签）。
- i18n：`zh.json` / `en.json` 全量改写 `assessmentFlow.zodiac/compatibility`、`dailyTarot`、`home.tests`、`assessmentList`、`home.dailyTarot/Desc/chemistry` 等键。
英文版作为"中式文化英文版"保留（拼音 + 注解，如 "I-Ching Hexagram"），便于海外用户也能体验东方文化。
- 首页 `Index.tsx`：每日塔罗卡 → 每日一卦；MBTI/九型/星座/心灵 → MBTI/九型/**生肖**/心灵。

### 后端（Supabase Edge Functions）

- 新建 `hexagram-draw` / `hexagram-draw-status` / `chat-hexagram-draw` / `prefill-hexagrams`（基于现有塔罗函数复制改写）。
- 改写 prompts：`assessment` (MBTI)、`assessment-enneagram`、`assessment-zodiac`、`assessment-emotion`、`assessment-compatibility` 内的系统提示，加入"中国文化语境""避免西方占星词汇"等约束。
- 旧塔罗函数保留一段过渡期，再删除。

### 数据库

- 如存在 `tarot_draws` / `tarot_cards_cache` 等表 → 新增对应 `hexagram_*` 表；老表数据可保留只读或迁移。
- `assessment_results` 表 type 枚举若有 `tarot/zodiac` → 新增 `hexagram/chinese_zodiac`。
- 具体表结构在动工前用 supabase--read_query 再确认一遍。

### 角色（agents）

- 现有四位角色（云生/星轨/暖暖/老王）保留。
- "星轨"原定位偏西方占星 → 文案微调为"东方命理研究者"或"占星 + 命理"双修，避免角色错位。

## 六、实施分期建议

```text
P0（本期，必做）
  - i18n 全量替换 + 首页/列表入口换名
  - MBTI / 九型 / 心灵 题干本土化重写
  - 星座 → 生肖运势（前端表单 + prompt 重写，复用现有函数）
  - 缘分配对 prompt 改为生肖合婚

P1（下一期）
  - 塔罗 → 周易一卦（数据 + 动画 + 新函数 + 数据库表）
  - 角色"星轨"定位微调

P2（远期可选）
  - 完整八字四柱命盘
  - 每日观音签
```

## 七、待你确认的关键决策

1. **P1 周易一卦** 是本期一起做，还是先做 P0、塔罗暂时保留？（工作量差异大）//每日一卦先不做，年轻人里似乎不一定看得懂周易算卦。
2. **英文版**怎么处理：A) 同步翻译成中式文化英文（I-Ching 等）；B) 英文版保留塔罗，仅中文版换。//英文版不做处理，我建议可以把设置里面的英文语言选项先隐藏掉。因为现在只面向中国大陆用户，不需要英文。
3. **生肖运势**是否需要让用户输入完整出生日期（年月日），还是只要"生肖 + 出生月"轻量版？//生肖运势不做替换，保留原有的星座运势。
4. 是否需要新增 **"每日求签"** 模块替换首页"每日塔罗"卡位？//需要