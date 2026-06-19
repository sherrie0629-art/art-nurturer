// Local fallback for Zodiac divination questions — shown instantly while
// the AI batch is fetched, so users never wait on a "building scenes" spinner.
// Format mirrors the AI batch (poetic intuition prompts, image-only options).

export interface PoolOption { label: string; text: string; }
export interface PoolQuestion { question: string; options: PoolOption[]; dimension: string; }
export type PoolSet = PoolQuestion[];

const ZH_SET: PoolSet = [
  { dimension: "overall", question: "🌙 闭眼三秒，第一道光是什么颜色？", options: [
    { label: "A", text: "破晓的金" }, { label: "B", text: "深海的蓝" },
    { label: "C", text: "晚霞的紫" }, { label: "D", text: "雾里的银" },
  ]},
  { dimension: "love", question: "💗 一只无名的手递给你一朵花，你看到的是？", options: [
    { label: "A", text: "盛开的红玫瑰" }, { label: "B", text: "半枯的白雏菊" },
    { label: "C", text: "带露的栀子" }, { label: "D", text: "夜里的昙花" },
  ]},
  { dimension: "career", question: "🗝 桌上摆着四把钥匙，你伸手拿哪一把？", options: [
    { label: "A", text: "厚重的铜匙" }, { label: "B", text: "纤细的银匙" },
    { label: "C", text: "古旧的木匙" }, { label: "D", text: "发光的水晶匙" },
  ]},
  { dimension: "fortune", question: "🪙 一枚硬币落地，发出的声音像什么？", options: [
    { label: "A", text: "清脆的铃响" }, { label: "B", text: "低沉的钟声" },
    { label: "C", text: "水滴入潭" }, { label: "D", text: "风过竹林" },
  ]},
  { dimension: "overall", question: "🌊 远方有一片水域，水面上漂着什么？", options: [
    { label: "A", text: "盛满月光的瓷碗" }, { label: "B", text: "羽毛与花瓣" },
    { label: "C", text: "一封未拆的信" }, { label: "D", text: "成群的萤火" },
  ]},
  { dimension: "love", question: "🎐 一阵风吹来，你最先听见什么？", options: [
    { label: "A", text: "风铃叮咚" }, { label: "B", text: "雨打芭蕉" },
    { label: "C", text: "远处的歌" }, { label: "D", text: "心跳的回声" },
  ]},
  { dimension: "career", question: "🪐 夜空中有一颗星突然亮起，它的形状是？", options: [
    { label: "A", text: "锋利的箭" }, { label: "B", text: "完整的圆" },
    { label: "C", text: "缠绕的藤" }, { label: "D", text: "未完的笔画" },
  ]},
  { dimension: "fortune", question: "🪞 镜子里浮现一个意象，你看到的是？", options: [
    { label: "A", text: "盛开的桃花" }, { label: "B", text: "燃烧的烛火" },
    { label: "C", text: "沉睡的飞鸟" }, { label: "D", text: "翻涌的潮汐" },
  ]},
  { dimension: "love", question: "🍷 杯中盛着什么液体？", options: [
    { label: "A", text: "清澈的泉水" }, { label: "B", text: "微醺的酒酿" },
    { label: "C", text: "浓稠的蜜" }, { label: "D", text: "凝住的霜" },
  ]},
  { dimension: "fortune", question: "🕯 一根蜡烛燃尽前的最后一刻，你看见的是？", options: [
    { label: "A", text: "一束光照向远处" }, { label: "B", text: "灰烬化成星" },
    { label: "C", text: "影子终于松开" }, { label: "D", text: "新的火苗悄悄升起" },
  ]},
];

const EN_SET: PoolSet = [
  { dimension: "overall", question: "🌙 Close your eyes — what colour is the first light you see?", options: [
    { label: "A", text: "Daybreak gold" }, { label: "B", text: "Deep-sea blue" },
    { label: "C", text: "Twilight violet" }, { label: "D", text: "Mist-soft silver" },
  ]},
  { dimension: "love", question: "💗 A nameless hand offers you a flower — which one?", options: [
    { label: "A", text: "A red rose in full bloom" }, { label: "B", text: "A half-wilted white daisy" },
    { label: "C", text: "Dew-pearled gardenia" }, { label: "D", text: "A night-blooming cereus" },
  ]},
  { dimension: "career", question: "🗝 Four keys lie before you — which do you reach for?", options: [
    { label: "A", text: "A heavy bronze key" }, { label: "B", text: "A slender silver key" },
    { label: "C", text: "An ancient wooden key" }, { label: "D", text: "A glowing crystal key" },
  ]},
  { dimension: "fortune", question: "🪙 A coin hits the floor — what sound does it make?", options: [
    { label: "A", text: "A bright bell-like ring" }, { label: "B", text: "A low temple chime" },
    { label: "C", text: "A drop into still water" }, { label: "D", text: "Wind through bamboo" },
  ]},
  { dimension: "overall", question: "🌊 On a distant lake, something floats. What is it?", options: [
    { label: "A", text: "A bowl holding moonlight" }, { label: "B", text: "Feathers and petals" },
    { label: "C", text: "An unopened letter" }, { label: "D", text: "A swarm of fireflies" },
  ]},
  { dimension: "love", question: "🎐 A breeze passes — what do you hear first?", options: [
    { label: "A", text: "Tinkling wind chimes" }, { label: "B", text: "Rain on broad leaves" },
    { label: "C", text: "A distant melody" }, { label: "D", text: "The echo of a heartbeat" },
  ]},
  { dimension: "career", question: "🪐 A star flares overhead — what shape is it?", options: [
    { label: "A", text: "A sharp arrow" }, { label: "B", text: "A whole circle" },
    { label: "C", text: "A winding vine" }, { label: "D", text: "An unfinished brushstroke" },
  ]},
  { dimension: "fortune", question: "🪞 An image appears in a mirror — what do you see?", options: [
    { label: "A", text: "Peach blossoms in bloom" }, { label: "B", text: "A burning candle" },
    { label: "C", text: "A sleeping bird" }, { label: "D", text: "A surging tide" },
  ]},
  { dimension: "love", question: "🍷 What is in the cup before you?", options: [
    { label: "A", text: "Clear spring water" }, { label: "B", text: "A mellow wine" },
    { label: "C", text: "Thick golden honey" }, { label: "D", text: "Crystallised frost" },
  ]},
  { dimension: "fortune", question: "🕯 In the candle's final flicker, you see —", options: [
    { label: "A", text: "A beam reaching far ahead" }, { label: "B", text: "Ashes turning into stars" },
    { label: "C", text: "A shadow finally letting go" }, { label: "D", text: "A new flame quietly rising" },
  ]},
];

export function pickZodiacQuestionSet(locale: string): PoolSet {
  return locale.startsWith("zh") ? ZH_SET : EN_SET;
}