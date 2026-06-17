# 中国内地文化角色整体替换计划

将 4 个北美角色（Chloe/Jax/Luna/Zoe）替换为 4 个中国内地角色（云生/星轨/暖暖/老王），保留 10 级羁绊架构，使用新拼音 ID，重新生成中国风头像，加入新的角色串联。

## 一、新角色映射

| 新 ID | 中文名 | 身份 | 替换原 ID | 风格定位 |
|---|---|---|---|---|
| `yunsheng` | 云生 | 解梦师·喜马拉雅隐士 | mystic | 温柔诗意、荣格象征 |
| `xinggui` | 星轨 | 星盘专家·星际旅者 | bestie | 优雅知性、宇宙视角 |
| `nuannuan` | 暖暖 | 疗愈师·时光缝补店 | barista | 温暖包容、CBT |
| `laowang` | 老王 | 毒舌树洞·退休心理医生 | jax | 犀利幽默、损友式 |

## 二、10 级羁绊扩写策略

保留现有 `BOND_THRESHOLDS = [0,6,16,30,50,75,105,140,180,230]` 与 10 级标签不变。把你给的 5 段剧情按"三层反转"骨架扩成 10 段：

- **Lv 1-3 表层人设**：日常细节（云生山下隐居、星轨修飞船、暖暖开小店、老王退休唠嗑）
- **Lv 4-5 第一层真相**：对应你原文的第 1-2 段（出现"梦中模糊身影 / 飞船坠毁 / 红伞 / 当过心理医生"）
- **Lv 6-7 反转 #1**：对应你的第 3-4 段（蓝色花海雪莲 / 母星消失 / 等待整个春天 / 治不好女儿）
- **Lv 8-9 反转 #2**：更深的隐秘层（清醒梦自照 / 不想离开了 / 凉透的热可可 / 女儿是恋爱脑）
- **Lv 10 终极袒露**：对应你的第 5 段（梦里身影渐清 / 牵挂是最强能量 / 爱过即完整 / 期待女儿那句"老王今天真帅"）

每位角色的 3 个隐藏彩蛋按你提供的触发词原文实现，输出格式 `【🔮 隐藏记忆解锁】` 开头，每个彩蛋写 Chinese 中文 + 多个中英文别名（沿用现有 `aliases` 数组机制）。

## 三、角色互相串联（新增）

- 云生 → 偶尔提到"山下小镇有家会缝补记忆的小店"（暖暖）
- 星轨 → 飞船坠毁时见过一个梦境里的山（云生的山）
- 暖暖 → 店里常客有位"嘴硬心软的老头会来骂走情伤客人"（老王）
- 老王 → 女儿喜欢看星座，常念叨一个叫星轨的（星轨）

形成"梦—星—心—骂"的隐性闭环。

## 四、新头像生成

用 `imagegen--generate_image`（premium 质量、9:16 头像横构图）生成 4 张中国风 webp：

- `src/assets/agent-yunsheng.webp` — 喜马拉雅山下隐士，长发青年，月光雪山，水墨意境
- `src/assets/agent-xinggui.webp` — 星际旅者，银发，星空披风，宇宙蓝紫色调
- `src/assets/agent-nuannuan.webp` — 古风女子，温暖针线小店，暖黄烛光
- `src/assets/agent-laowang.webp` — 退休中年大叔，老花镜，茶杯，市井温馨

## 五、文件改动清单

**核心数据**
- `src/data/agents.ts` — 整体重写 4 个 agent 对象（ID/name/title/description/quote/image/gradient/systemPrompt/lore×10/easterEggs×3），保留 `BOND_THRESHOLDS / BOND_LABELS / STORY_REVEAL_RULES / 接口定义` 不变

**i18n**
- `src/i18n/locales/zh.json` — 重写约 100 处包含旧角色 ID/名字的键：
  - 角色键 `barista/jax/mystic/bestie` → `nuannuan/laowang/xinggui/yunsheng`
  - 欢迎语、占位提示、彩蛋中文文案、关联角色名（如 "talkToLuna" → "talkToXinggui"）
  - 角色"今晚动态"4 条小卡片重写
- `src/i18n/locales/en.json` — 同步重写英文版（保留 ID 为拼音，名字英文用拼音+title）

**数据库迁移（schema/数据迁移）**
- 新建 migration：把 `agent_bonds / chat_messages / conversations / conversation_summaries / story_vault / user_memories` 等表中 `agent_id` 字段的历史值从老 ID 迁到新 ID（按映射 mystic→yunsheng, bestie→xinggui, barista→nuannuan, jax→laowang），保证老用户的羁绊与历史无缝继承
- `achievement_defs` 表若按 agent_id 存了成就，同步 UPDATE

**附带处理**
- `src/data/achievements.ts` — 如果含老 ID 字符串，同步替换
- `supabase/functions/chat/index.ts` 等 Edge Function — 检查是否硬编码了 agent_id，做相应调整
- 旧头像文件 `src/assets/agent-{barista,jax,mystic,bestie}.webp` 删除

## 六、不改动的部分

- 羁绊等级数（仍 10 级）、阈值、标签
- 成就系统、UI 组件（AgentCard / AgentProfileDrawer / BondLevelUp / BondIndicator）
- 心灵宇宙、塔罗、占卜、MBTI 等其他模块
- AI 网关与 Gemini 配置

## 七、验证步骤

1. 启动后查 `/` 与 `/archive` 看到 4 张新中国风卡片
2. 进任意角色聊天 → 触发彩蛋词（如"抽张牌"对 xinggui 不再生效，对应触发词如"42""你的飞船长什么样""想家吗"）确认 `【🔮 隐藏记忆解锁】` 正常输出
3. 已登录账号查老羁绊数据：迁移后能在新角色卡上看到原有等级
4. zh.json/en.json 编译无 key miss

---

技术要点（开发参考）：
- `agents.ts` 用 ASCII 直接写中文（项目已支持 UTF-8）
- 系统提示词全部用中文撰写，并保留 `STORY_REVEAL_RULES` 英文段（已被现有 chat 流水线读取）
- 彩蛋 `aliases` 同时覆盖中文别名与拼音/英文常用变体，提高命中率
