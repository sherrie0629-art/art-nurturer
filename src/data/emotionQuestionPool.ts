// Local fallback for wellness (心灵护理) questions — show Q1 instantly while AI batch loads.

export interface PoolOption { label: string; text: string; }
export interface PoolQuestion { question: string; options: PoolOption[]; dimension: string; }
export type PoolSet = PoolQuestion[];

const ZH_SET: PoolSet = [
  {
    dimension: "burnout",
    question: "周一早上闹钟响了第三遍，你赖床的那几分钟里，脑子里第一个念头是……",
    options: [
      { label: "A", text: "再拖 5 分钟，今天也能撑过去" },
      { label: "B", text: "想到待办清单，胃先紧了一下" },
      { label: "C", text: "干脆请假，但马上又否定自己" },
      { label: "D", text: "刷手机转移注意力，直到最后一刻" },
    ],
  },
  {
    dimension: "burnout",
    question: "下午三点，同事又在群里 @你改一个小需求，你手指停在键盘上……",
    options: [
      { label: "A", text: "秒回「好的」，心里默默叹一口气" },
      { label: "B", text: "假装在忙，晚半小时再回" },
      { label: "C", text: "直接说现在排满了，明天再说" },
      { label: "D", text: "一边改一边想「为什么又是我」" },
    ],
  },
  {
    dimension: "burnout",
    question: "周末本说休息，结果「就再看一眼工作群」已经两小时了，这时你……",
    options: [
      { label: "A", text: "继续回消息，觉得不回会内疚" },
      { label: "B", text: "关掉手机，但脑子还在转" },
      { label: "C", text: "干脆躺平，什么也不想干" },
      { label: "D", text: "用追剧/游戏把自己灌满" },
    ],
  },
  {
    dimension: "energy",
    question: "吃完午饭回到工位，面前堆着未读消息，你最先做的是……",
    options: [
      { label: "A", text: "先冲杯咖啡或茶，再慢慢看" },
      { label: "B", text: "从最急的那条开始，一口气清完" },
      { label: "C", text: "发呆几分钟，等状态回来" },
      { label: "D", text: "刷短视频「充电」，再开工" },
    ],
  },
  {
    dimension: "energy",
    question: "难得空出 20 分钟，你更可能……",
    options: [
      { label: "A", text: "补一件小事，免得后面更赶" },
      { label: "B", text: "出门走走或拉伸，让脑子换档" },
      { label: "C", text: "躺着刷手机，时间一下就没了" },
      { label: "D", text: "找个人聊两句，借点人气" },
    ],
  },
  {
    dimension: "boundaries",
    question: "周日晚上 11 点，老板在微信发了一句「明天能不能早点到？」，你盯着屏幕……",
    options: [
      { label: "A", text: "秒回「好的没问题」，然后失眠到 2 点" },
      { label: "B", text: "故意 20 分钟后回，假装在忙" },
      { label: "C", text: "直接问「几点算早？有什么事吗？」" },
      { label: "D", text: "已读不回，明天正常时间到" },
    ],
  },
  {
    dimension: "boundaries",
    question: "朋友临时取消约会，说「下次吧」，你已经为此推掉别的事，你会……",
    options: [
      { label: "A", text: "说「没事」，但心里有点失落" },
      { label: "B", text: "半开玩笑提一句「我妆都化好了」" },
      { label: "C", text: "直接表达失望，希望对方重视" },
      { label: "D", text: "不再提，慢慢减少主动联系" },
    ],
  },
  {
    dimension: "sleep",
    question: "凌晨 1 点你已经躺下了，但还在刷一个完全不感兴趣的短视频，这一刻你心里……",
    options: [
      { label: "A", text: "知道该睡了，就是停不下来" },
      { label: "B", text: "怕一闭眼明天就来了" },
      { label: "C", text: "用噪音把脑子里的事盖过去" },
      { label: "D", text: "干脆起来做点事，反正也睡不着" },
    ],
  },
  {
    dimension: "sleep",
    question: "明明困得不行，躺下却开始复盘白天某句对话，你通常……",
    options: [
      { label: "A", text: "反复想自己哪里说错了" },
      { label: "B", text: "打开备忘录写下担心的事" },
      { label: "C", text: "听白噪音或播客直到睡着" },
      { label: "D", text: "越躺越清醒，干脆起来刷手机" },
    ],
  },
  {
    dimension: "regulation",
    question: "突然收到一条让你火大的消息，你给出的第一反应是……",
    options: [
      { label: "A", text: "立刻打字回怼，发出去又后悔" },
      { label: "B", text: "锁屏，等冷静了再回" },
      { label: "C", text: "找朋友吐槽，把情绪倒出去" },
      { label: "D", text: "假装没看见，但心里记一笔" },
    ],
  },
];

const EN_SET: PoolSet = [
  {
    dimension: "burnout",
    question: "Monday morning — the alarm's gone off for the third time. Lying there, your first thought is…",
    options: [
      { label: "A", text: "Five more minutes — I can survive today" },
      { label: "B", text: "My to-do list hits my stomach before my feet hit the floor" },
      { label: "C", text: "Call in sick — then immediately talk myself out of it" },
      { label: "D", text: "Scroll until the last possible second" },
    ],
  },
  {
    dimension: "burnout",
    question: "3 p.m. — a coworker @s you in the group chat for a tiny tweak. Your fingers freeze on the keyboard…",
    options: [
      { label: "A", text: "Reply \"on it!\" with a silent sigh" },
      { label: "B", text: "Go invisible, answer in half an hour" },
      { label: "C", text: "Say you're full today, tomorrow works" },
      { label: "D", text: "Fix it while thinking \"why me again\"" },
    ],
  },
  {
    dimension: "burnout",
    question: "You promised yourself a rest day, but \"just one peek at Slack\" turned into two hours. You…",
    options: [
      { label: "A", text: "Keep replying — guilt if you don't" },
      { label: "B", text: "Close the app, but your brain won't stop" },
      { label: "C", text: "Flatline — can't motivate anything" },
      { label: "D", text: "Numb out with shows or games" },
    ],
  },
  {
    dimension: "energy",
    question: "Back at your desk after lunch, unread messages piled up. You first…",
    options: [
      { label: "A", text: "Make coffee/tea, then ease in" },
      { label: "B", text: "Attack the most urgent thread first" },
      { label: "C", text: "Stare blankly until you feel human" },
      { label: "D", text: "Scroll short videos to \"recharge\"" },
    ],
  },
  {
    dimension: "energy",
    question: "You suddenly have 20 free minutes. Most likely you…",
    options: [
      { label: "A", text: "Knock out a small task before it snowballs" },
      { label: "B", text: "Walk or stretch to reset your head" },
      { label: "C", text: "Lie down scrolling until time vanishes" },
      { label: "D", text: "Text someone to borrow a little social energy" },
    ],
  },
  {
    dimension: "boundaries",
    question: "Sunday 11 p.m. — your boss texts \"can you come in early tomorrow?\" You stare at the screen…",
    options: [
      { label: "A", text: "Instant \"sure!\" — then lie awake till 2" },
      { label: "B", text: "Wait 20 minutes, pretend you were busy" },
      { label: "C", text: "Ask \"how early, and for what?\"" },
      { label: "D", text: "Leave on read, show up at normal time" },
    ],
  },
  {
    dimension: "boundaries",
    question: "A friend cancels last minute — \"rain check?\" — after you cleared your day. You…",
    options: [
      { label: "A", text: "Say \"no worries\" but feel a little dropped" },
      { label: "B", text: "Joke \"I already got ready for this\"" },
      { label: "C", text: "Name the disappointment directly" },
      { label: "D", text: "Say nothing — slowly contact them less" },
    ],
  },
  {
    dimension: "sleep",
    question: "1 a.m., in bed, still scrolling videos you don't even care about. In that moment you…",
    options: [
      { label: "A", text: "Know you should sleep — can't stop anyway" },
      { label: "B", text: "Fear closing your eyes means tomorrow arrives" },
      { label: "C", text: "Use noise to drown out your thoughts" },
      { label: "D", text: "Get up and do something — sleep isn't coming" },
    ],
  },
  {
    dimension: "sleep",
    question: "Exhausted but awake, replaying one line from today's conversation. You usually…",
    options: [
      { label: "A", text: "Loop on what you said wrong" },
      { label: "B", text: "Open notes and dump every worry" },
      { label: "C", text: "White noise or a podcast till you fade out" },
      { label: "D", text: "Get more awake — reach for the phone again" },
    ],
  },
  {
    dimension: "regulation",
    question: "A message lands that instantly pisses you off. Your first move is…",
    options: [
      { label: "A", text: "Type a sharp reply — regret it after sending" },
      { label: "B", text: "Lock the phone, respond when cooled down" },
      { label: "C", text: "Vent to a friend to get it out" },
      { label: "D", text: "Ghost it — but file it away mentally" },
    ],
  },
];

export function pickEmotionQuestionSet(locale: string): PoolSet {
  return locale.startsWith("zh") ? ZH_SET : EN_SET;
}
