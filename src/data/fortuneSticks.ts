// 灵签（参考观音灵签 / 关帝灵签的本土文化形式，去宗教化）
// 总共 100 签，按签等分布；每签包含签题（典故/比喻）、四句签诗、白话提点。
// 数据仅供 AI 解签时的语境锚点，AI 会再做现代化解读。

export type StickLevel = "上上签" | "上签" | "中签" | "下签" | "下下签";

export interface FortuneStick {
  number: number; // 1-100
  level: StickLevel;
  title: string; // 签题
  poem: string; // 四句签诗，用 \n 分隔
  hint: string; // 一句白话提点
}

// 签等概率（合计 100）
const LEVEL_WEIGHTS: Array<[StickLevel, number]> = [
  ["上上签", 8],
  ["上签", 22],
  ["中签", 40],
  ["下签", 22],
  ["下下签", 8],
];

export const FORTUNE_STICKS: FortuneStick[] = [
  { number: 1, level: "上上签", title: "鸿运当头", poem: "云开月出照天台\n万里清辉一径来\n莫问前程多少里\n春风已渡玉门开", hint: "好运临门，把握当下，顺势而为。" },
  { number: 2, level: "上上签", title: "金榜题名", poem: "十年磨剑一朝鸣\n姓名高悬第一名\n莫道功名无定数\n精诚所至自然成", hint: "长期积累将迎来回报，重要场合一击即中。" },
  { number: 3, level: "上上签", title: "百花迎春", poem: "春风一夜遍枝头\n红紫芬芳满院幽\n万事更新皆顺遂\n人逢喜事乐悠悠", hint: "新阶段万象更新，宜启动新计划。" },
  { number: 4, level: "上上签", title: "凤鸣朝阳", poem: "凤鸣高冈彩云飞\n旭日东升万象辉\n德音远播声名起\n贵人相助福星随", hint: "才华被看见，会有贵人提携。" },
  { number: 5, level: "上上签", title: "心想事成", poem: "心中所愿付青天\n暗里神明早记全\n但守初心行正道\n春来花发自天然", hint: "守住本心，所求皆有回应。" },
  { number: 6, level: "上上签", title: "和合美满", poem: "鸳鸯比翼戏池中\n月老红绳系正浓\n姻缘天定无须问\n白头偕老乐融融", hint: "感情走向稳定，宜定下来。" },
  { number: 7, level: "上上签", title: "金玉满堂", poem: "山中藏玉海生珠\n劳作辛勤福禄俱\n莫笑当前清贫日\n他年富贵自然殊", hint: "踏实付出会换来丰收，财运渐旺。" },
  { number: 8, level: "上上签", title: "万事亨通", poem: "一帆风顺过江流\n万里晴空任去留\n所谋所望皆如意\n喜气盈门福满楼", hint: "近期阻力极小，胆子放大些去做。" },

  { number: 9, level: "上签", title: "守得云开", poem: "几番风雨几番晴\n云破天开月又明\n旧事休提皆已矣\n新章正待笔锋成", hint: "熬过最难的一段，转机就在前方。" },
  { number: 10, level: "上签", title: "贵人相助", poem: "独木难支独行难\n忽逢知己慰心安\n莫嫌相识时光短\n他日相扶上彩鸾", hint: "近期会遇贵人，要主动开口、多走动。" },
  { number: 11, level: "上签", title: "渐入佳境", poem: "山路弯弯渐入幽\n柳暗花明又一州\n莫嫌前路艰难处\n佳境天成在尽头", hint: "事情慢慢变好，耐心走完最后一段。" },
  { number: 12, level: "上签", title: "春风送暖", poem: "东风一夜入帘栊\n冷尽残冬暖意浓\n万事萌芽时已至\n莫负青春莫负侬", hint: "情绪与运势同时回暖，宜行动。" },
  { number: 13, level: "上签", title: "锦上添花", poem: "本是清平好景天\n更逢喜事到门前\n珠联璧合添新彩\n双喜临门福寿全", hint: "原本就顺利，会再迎来惊喜。" },
  { number: 14, level: "上签", title: "良缘天成", poem: "天涯何处觅知音\n蓦然回首在身边\n莫错良缘错时节\n珍之惜之共流年", hint: "对的人可能就在身边，别再到处找。" },
  { number: 15, level: "上签", title: "财源广进", poem: "源头活水自悠悠\n点滴汇成大江流\n莫贪一时大富贵\n积少成多福自厚", hint: "财运稳步增长，宜稳健理财。" },
  { number: 16, level: "上签", title: "前程似锦", poem: "鲤跃龙门志气豪\n万里风云任尔遨\n青云有路凭君上\n他日声名万古高", hint: "事业有上升空间，敢冲就有结果。" },
  { number: 17, level: "上签", title: "心安福至", poem: "心若无尘事自宽\n云开月朗自悠然\n但行好事莫问果\n福报已在不言间", hint: "放下计较，福气自然来。" },
  { number: 18, level: "上签", title: "学有所成", poem: "十年寒窗终有时\n灯下勤勉不空辞\n书中自有黄金屋\n他日功成天下知", hint: "学习/技能精进期，专注就有回报。" },
  { number: 19, level: "上签", title: "出行平安", poem: "驾舟扬帆向远方\n顺风顺水入吉乡\n所到之处皆顺遂\n归来满载笑相迎", hint: "外出或换环境会带来好运。" },
  { number: 20, level: "上签", title: "家宅安康", poem: "门庭清宁福满堂\n四时安泰乐无疆\n莫言琐事多烦扰\n和气方为聚宝囊", hint: "家里关系是底气，多陪伴。" },
  { number: 21, level: "上签", title: "时来运转", poem: "枯木逢春再发新\n久旱甘霖润万民\n往日忧愁皆散去\n喜气盈门好运临", hint: "低谷期已过，开始翻盘。" },
  { number: 22, level: "上签", title: "心愿得偿", poem: "斋心默祷向苍天\n所愿之事在眼前\n莫忘当初许愿日\n常怀感念福绵延", hint: "近期目标可达成，记得感恩。" },

  { number: 23, level: "中签", title: "见机而行", poem: "山雨欲来风满楼\n是进是退细推求\n机缘自有定时至\n莫慌莫躁莫强求", hint: "局势不明，先观察再动手。" },
  { number: 24, level: "中签", title: "尘埃未定", poem: "事到中途未可知\n云遮月色一时迷\n且将心事埋深处\n等待东风正起时", hint: "结果还没出，不要提前下判断。" },
  { number: 25, level: "中签", title: "中庸为安", poem: "不求大富不求贫\n安守本分日日新\n月有阴晴人有意\n平淡之中见真醇", hint: "近期宜保守，平稳就是赚。" },
  { number: 26, level: "中签", title: "且行且看", poem: "前路漫漫雾未消\n一步一履莫心焦\n时来天地皆同力\n时去英雄不自由", hint: "走一步看一步，不要全盘押注。" },
  { number: 27, level: "中签", title: "进退两难", poem: "前有山高后水长\n左思右想费思量\n不如静坐听风去\n答案自来心自凉", hint: "卡在岔路口，先暂停一下听内心。" },
  { number: 28, level: "中签", title: "守旧防新", poem: "旧路虽平已熟知\n新途未必更相宜\n莫贪眼前花一朵\n根深叶茂自有时", hint: "近期不宜换跑道，把熟悉的做扎实。" },
  { number: 29, level: "中签", title: "和气生财", poem: "莫与他人争短长\n退一步时路自宽\n和气一团皆是宝\n人际关系胜金银", hint: "靠人脉吃饭的时刻，少争多让。" },
  { number: 30, level: "中签", title: "得失参半", poem: "得也无须太欢喜\n失也无须太忧伤\n世间万事如棋局\n胜负终归一场场", hint: "本周有得有失，心态放平。" },
  { number: 31, level: "中签", title: "勤能补拙", poem: "天资非高莫自悲\n勤能补拙世人知\n滴水穿石非一日\n功到深处自然来", hint: "靠天赋不行就靠苦功，慢慢来。" },
  { number: 32, level: "中签", title: "近忧远虑", poem: "今日烦心明日忧\n人生那得几时休\n莫将琐事填心海\n抬头还有满天秋", hint: "别被小事困住，抬头看大方向。" },
  { number: 33, level: "中签", title: "因缘际会", poem: "萍水相逢亦是缘\n或近或远各有天\n莫强他人留身畔\n来去自如方坦然", hint: "缘聚缘散不要勉强。" },
  { number: 34, level: "中签", title: "稳中求进", poem: "稳坐钓鱼台上望\n风波不动钓丝长\n大鱼自会上钩日\n何须急急乱抛纲", hint: "沉得住气，鱼自然上钩。" },
  { number: 35, level: "中签", title: "暗中谋划", poem: "明枪易躲暗箭难\n做事低调避祸端\n锋芒太露招人忌\n藏拙守朴保平安", hint: "近期不要太张扬，闷声干。" },
  { number: 36, level: "中签", title: "退一步海阔", poem: "气大伤身意难平\n回首一笑万事轻\n忍得片时风浪息\n海阔天空任你行", hint: "正在为某事憋火？先退一步。" },
  { number: 37, level: "中签", title: "随遇而安", poem: "云行雨施任天然\n何须强求事事圆\n顺其自然心自定\n万事万物各有缘", hint: "别再硬撑或对抗，顺势就好。" },
  { number: 38, level: "中签", title: "守口如瓶", poem: "祸从口出古今传\n言多必失要慎言\n沉默有时胜千语\n是非自有公道还", hint: "近期话少一点，避免口舌之争。" },
  { number: 39, level: "中签", title: "贵人在远", poem: "故乡亲友难相助\n远方知己自天来\n莫嫌路途千里隔\n机缘正在他乡开", hint: "贵人不一定在熟悉的圈子里。" },
  { number: 40, level: "中签", title: "事缓则圆", poem: "急切之心难成事\n缓缓推之事乃成\n莫如细水长流去\n滴穿顽石不留痕", hint: "心急吃不了热豆腐，慢慢推进。" },
  { number: 41, level: "中签", title: "三思后行", poem: "事到临头莫慌张\n三思而后再思量\n一时冲动千年悔\n稳重之人福寿长", hint: "重要决定不要冲动，多想 24 小时。" },
  { number: 42, level: "中签", title: "破镜重圆", poem: "破镜虽难再得圆\n真心相对总堪怜\n冰释前嫌重相聚\n旧情新意两难全", hint: "旧关系有修复可能，但需双方努力。" },

  { number: 43, level: "下签", title: "雾里看花", poem: "雾锁千山月不明\n人心难测路难行\n莫将虚像当真景\n看破方知是浮云", hint: "信息不全/被表象骗，等清楚再说。" },
  { number: 44, level: "下签", title: "小有挫折", poem: "石上栽花花不开\n沙中行船船难来\n时运未至莫强求\n暂将壮志藏胸怀", hint: "近期努力收效甚微，先停一停。" },
  { number: 45, level: "下签", title: "防范小人", poem: "笑里藏刀古来有\n君子防小不防偷\n言行举止须谨慎\n莫将真心付奸俦", hint: "身边可能有人不怀好意，慎重。" },
  { number: 46, level: "下签", title: "财来财去", poem: "辛苦积来一袋金\n转眼如风落他人\n莫信花言巧语者\n钱财进出要谨慎", hint: "近期破财风险，避免冲动消费。" },
  { number: 47, level: "下签", title: "事与愿违", poem: "本是好心待他人\n却换误解一身尘\n世事难全人难懂\n清者自清何须辩", hint: "好心可能被误解，但时间会证明。" },
  { number: 48, level: "下签", title: "口舌是非", poem: "无端是非起街头\n清白难辩两泪流\n沉默以对方是计\n莫与狂犬论短长", hint: "近期容易卷入口水仗，少说为妙。" },
  { number: 49, level: "下签", title: "身体示警", poem: "形劳神疲气难顺\n莫将健康作儿戏\n一日疏忽千日补\n惜身惜命方有期", hint: "身体在抗议，立刻给自己一个休息。" },
  { number: 50, level: "下签", title: "感情起伏", poem: "潮起潮落两心忧\n情深缘浅各自留\n莫将真心强相付\n聚散离合本无由", hint: "感情有波澜，给彼此一点空间。" },
  { number: 51, level: "下签", title: "迷途难返", poem: "误入歧途不知归\n越行越远心越灰\n回头岸边犹未晚\n执迷不悟更可悲", hint: "意识到走错就尽早调头。" },
  { number: 52, level: "下签", title: "诸事不顺", poem: "出门遇雨归无路\n事事推诿难成功\n且把心情慢慢理\n等待春来再筑功", hint: "今天/这周诸事不顺，宜窝着。" },
  { number: 53, level: "下签", title: "强求生怨", poem: "强按牛头不饮水\n硬扭瓜来自不甜\n世间万事皆有定\n强求只会徒生怨", hint: "别再勉强他人或自己。" },
  { number: 54, level: "下签", title: "暗中破财", poem: "钱财悄悄如流水\n看似有时已无踪\n账目要清防漏洞\n莫让贪欲蒙了眼", hint: "查账，留意被忽视的小额支出。" },
  { number: 55, level: "下签", title: "孤立无援", poem: "独立寒秋少人随\n往日相伴各自归\n人情冷暖看在眼\n靠己方为长久计", hint: "别人帮不上忙，先靠自己。" },
  { number: 56, level: "下签", title: "情路坎坷", poem: "情深不寿古来叹\n执着痴心徒自怜\n聚散有时缘有定\n放手未必不团圆", hint: "感情走得艰难，学着放轻一点。" },
  { number: 57, level: "下签", title: "防火防盗", poem: "深夜独行须留意\n值钱之物莫张扬\n防人之心不可无\n小心驶得万年船", hint: "贵重物品/账号密码加强防护。" },
  { number: 58, level: "下签", title: "心绪难宁", poem: "辗转反侧夜难眠\n万千心事涌心间\n莫待天明愁更甚\n且把心事付青烟", hint: "情绪很乱时，先睡一觉再说。" },
  { number: 59, level: "下签", title: "事倍功半", poem: "勤奋一日收获少\n汗水十分换三分\n时机方法都要看\n蛮干只会损精神", hint: "用力没用对方向，先换个方法。" },
  { number: 60, level: "下签", title: "易遇骗局", poem: "天降馅饼非真意\n甜言蜜语多陷阱\n稳扎稳打莫贪快\n步步小心保身平", hint: "出现「轻松高回报」的机会，多半是坑。" },

  { number: 61, level: "下下签", title: "时运不济", poem: "黑云压城风雨急\n屋漏偏逢连夜雨\n暂避锋芒守本分\n等到云开见月时", hint: "这段就是低谷，少做事多休息。" },
  { number: 62, level: "下下签", title: "失之交臂", poem: "良机已过悔不及\n月落星沉空叹息\n莫将旧事再回首\n珍惜眼前莫迟疑", hint: "已经错过的事就放下，看现在的。" },
  { number: 63, level: "下下签", title: "倾家荡产", poem: "贪心难填欲海深\n一念之差千金尽\n知止方能保平安\n回头犹可换乾坤", hint: "高风险投机赶紧停手。" },
  { number: 64, level: "下下签", title: "病灾缠身", poem: "身体抱恙莫迟疑\n求医问药要及时\n莫将小病拖成大\n健康方是最大财", hint: "有不舒服立刻就医。" },
  { number: 65, level: "下下签", title: "众叛亲离", poem: "昔日朋友皆远去\n知心之人难再寻\n反省自身改过错\n方能重得众人心", hint: "如果众人都离开，先反思自己。" },
  { number: 66, level: "下下签", title: "走投无路", poem: "前山阻路后水拦\n左右无门可逃难\n绝处往往逢生机\n静心等待天降缘", hint: "看似走投无路时，反而要静下来。" },
  { number: 67, level: "下下签", title: "祸不单行", poem: "一难方过又一难\n好似乌云不肯散\n咬牙忍过这阵子\n他日回首皆笑谈", hint: "正在屋漏偏逢连夜雨，先扛住。" },
  { number: 68, level: "下下签", title: "情断缘尽", poem: "落花有意水无情\n聚散匆匆各西东\n缘分到此该收尾\n莫强留时徒伤心", hint: "强留无益，体面告别。" },
];

function weightedRandomLevel(): StickLevel {
  const total = LEVEL_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [level, w] of LEVEL_WEIGHTS) {
    r -= w;
    if (r <= 0) return level;
  }
  return "中签";
}

export function drawRandomStick(): FortuneStick {
  // 先按等级加权抽，再在该等级内均匀抽
  const level = weightedRandomLevel();
  const pool = FORTUNE_STICKS.filter((s) => s.level === level);
  if (pool.length === 0) {
    return FORTUNE_STICKS[Math.floor(Math.random() * FORTUNE_STICKS.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function findStickByNumber(n: number): FortuneStick | undefined {
  return FORTUNE_STICKS.find((s) => s.number === n);
}

export const LEVEL_COLOR: Record<StickLevel, string> = {
  "上上签": "text-red-500",
  "上签": "text-amber-500",
  "中签": "text-emerald-500",
  "下签": "text-slate-500",
  "下下签": "text-indigo-500",
};

export const LEVEL_EMOJI: Record<StickLevel, string> = {
  "上上签": "🌟",
  "上签": "✨",
  "中签": "🍀",
  "下签": "🌙",
  "下下签": "🕯️",
};