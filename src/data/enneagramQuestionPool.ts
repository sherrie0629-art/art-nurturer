// Local fallback for Enneagram scenario questions — used while the AI batch
// is being fetched, so users see Q1 instantly.

export interface PoolOption { label: string; text: string; }
export interface PoolQuestion { question: string; options: PoolOption[]; dimension: string; }
export type PoolSet = PoolQuestion[];

const ZH_SET: PoolSet = [
  { dimension: "motivation", question: "📅 周末难得空一天，你最想干嘛？", options: [
    { label: "A", text: "把拖了很久的清单清掉" }, { label: "B", text: "约朋友热闹一场" },
    { label: "C", text: "去做一件能拍出来的事" }, { label: "D", text: "一个人安安静静待着" },
  ]},
  { dimension: "fear", question: "😶 同事在群里夸你做的方案，你心里第一反应是？", options: [
    { label: "A", text: "认真回一句\"还能更好\"" }, { label: "B", text: "暖了一下，谢谢对方" },
    { label: "C", text: "想着下一份要再炸一点" }, { label: "D", text: "怀疑是不是有别的意思" },
  ]},
  { dimension: "relationship", question: "🍵 朋友突然冷淡你，没解释。", options: [
    { label: "A", text: "立刻发消息问怎么了" }, { label: "B", text: "默默拉开距离" },
    { label: "C", text: "反思自己哪里做错" }, { label: "D", text: "假装没察觉，照常相处" },
  ]},
  { dimension: "stress", question: "🔥 项目临时改方向，明天就交。", options: [
    { label: "A", text: "撸起袖子加班，今晚搞定" }, { label: "B", text: "拉所有人开会重新分工" },
    { label: "C", text: "心里一沉，但表面镇定" }, { label: "D", text: "干脆先躺一下再说" },
  ]},
  { dimension: "growth", question: "🌱 有人指出你身上一个老问题。", options: [
    { label: "A", text: "认真记下，回去复盘" }, { label: "B", text: "表面接受，心里委屈" },
    { label: "C", text: "当场反驳：你不了解我" }, { label: "D", text: "笑着转开话题" },
  ]},
  { dimension: "motivation", question: "🎁 突然有一笔意外的钱，怎么花？", options: [
    { label: "A", text: "存起来，以备不时之需" }, { label: "B", text: "请最近想见的人吃顿好的" },
    { label: "C", text: "买一件早就盯着的好东西" }, { label: "D", text: "捐一部分，剩下慢慢花" },
  ]},
  { dimension: "relationship", question: "💬 群里有人吵起来了。", options: [
    { label: "A", text: "出来调停，把话题拉回正轨" }, { label: "B", text: "默默退出，不掺和" },
    { label: "C", text: "私聊安抚那个受委屈的" }, { label: "D", text: "看完热闹再决定要不要发言" },
  ]},
  { dimension: "fear", question: "🌃 凌晨睡不着，你的第一念头是？", options: [
    { label: "A", text: "明天那件事会不会出错" }, { label: "B", text: "是不是有人在生我气" },
    { label: "C", text: "我这辈子到底想要什么" }, { label: "D", text: "干脆起来做点事" },
  ]},
  { dimension: "stress", question: "🚪 一段关系让你很累，但还没破。", options: [
    { label: "A", text: "硬扛下去，对方需要我" }, { label: "B", text: "认真谈一次，把话挑明" },
    { label: "C", text: "悄悄抽身，慢慢淡出" }, { label: "D", text: "找朋友吐槽，再撑一阵" },
  ]},
  { dimension: "growth", question: "🌅 一年之后的你，最希望是哪种状态？", options: [
    { label: "A", text: "做事更有章法，更踏实" }, { label: "B", text: "心更稳，不再为小事内耗" },
    { label: "C", text: "活得更敢、更舒展" }, { label: "D", text: "身边有几个真正贴心的人" },
  ]},
];

const EN_SET: PoolSet = [
  { dimension: "motivation", question: "📅 A rare free Saturday — what do you actually want to do?", options: [
    { label: "A", text: "Knock out the long-overdue to-do list" }, { label: "B", text: "Round up friends for a loud night" },
    { label: "C", text: "Do something worth photographing" }, { label: "D", text: "Just be quietly alone" },
  ]},
  { dimension: "fear", question: "😶 A coworker publicly praises your work. Your first inner reaction?", options: [
    { label: "A", text: "Reply: \"it can be better\"" }, { label: "B", text: "A warm thank-you" },
    { label: "C", text: "Already planning a flashier next one" }, { label: "D", text: "Wonder if they meant something else" },
  ]},
  { dimension: "relationship", question: "🍵 A friend has gone cold on you, no reason given.", options: [
    { label: "A", text: "Message them right away: \"everything ok?\"" }, { label: "B", text: "Quietly pull back too" },
    { label: "C", text: "Replay what you might have done wrong" }, { label: "D", text: "Act like nothing's off, keep things normal" },
  ]},
  { dimension: "stress", question: "🔥 The project pivots overnight — due tomorrow.", options: [
    { label: "A", text: "Sleeves up, pull a late night, ship it" }, { label: "B", text: "Call a meeting, redivide the work" },
    { label: "C", text: "Heart sinks, but stay outwardly calm" }, { label: "D", text: "Lie down first, deal with it after" },
  ]},
  { dimension: "growth", question: "🌱 Someone names an old pattern of yours.", options: [
    { label: "A", text: "Write it down, debrief later" }, { label: "B", text: "Nod outside, sting inside" },
    { label: "C", text: "Push back: \"you don't really know me\"" }, { label: "D", text: "Laugh and steer the topic away" },
  ]},
  { dimension: "motivation", question: "🎁 Unexpected money lands in your account.", options: [
    { label: "A", text: "Save it for a rainy day" }, { label: "B", text: "Treat someone you've been missing" },
    { label: "C", text: "Buy the thing you've been eyeing" }, { label: "D", text: "Donate part, spend the rest slowly" },
  ]},
  { dimension: "relationship", question: "💬 A group chat erupts into a fight.", options: [
    { label: "A", text: "Step in and steer it back" }, { label: "B", text: "Mute and stay out of it" },
    { label: "C", text: "DM the one who got hurt" }, { label: "D", text: "Watch first, decide later whether to speak" },
  ]},
  { dimension: "fear", question: "🌃 Can't sleep at 2 a.m. — what comes up first?", options: [
    { label: "A", text: "Did I prepare enough for tomorrow?" }, { label: "B", text: "Is someone secretly upset with me?" },
    { label: "C", text: "What do I actually want from my life?" }, { label: "D", text: "Just get up and do something" },
  ]},
  { dimension: "stress", question: "🚪 A relationship is draining you, but hasn't broken.", options: [
    { label: "A", text: "Hold on — they need me" }, { label: "B", text: "Have the hard talk, put it on the table" },
    { label: "C", text: "Quietly drift, fade out slow" }, { label: "D", text: "Vent to friends, push through a while longer" },
  ]},
  { dimension: "growth", question: "🌅 A year from now, who do you most want to be?", options: [
    { label: "A", text: "More structured, more solid" }, { label: "B", text: "Steadier — less self-spinning over small things" },
    { label: "C", text: "Bolder, freer, more myself" }, { label: "D", text: "Surrounded by a few truly close people" },
  ]},
];

export function pickEnneagramQuestionSet(locale: string): PoolSet {
  return locale.startsWith("zh") ? ZH_SET : EN_SET;
}