// Local 16-type parallel-universe identities for the unauthenticated /
// fallback path. AI version (edge function) is used when signed in.

export interface PUEntry {
  magic: { role: string; description: string };
  cyberpunk: { role: string; description: string };
}

type Locale = { zh: PUEntry; en: PUEntry };

const BANK: Record<string, Locale> = {
  INTJ: {
    zh: {
      magic: { role: `深塔里的禁咒推演者`, description: `你住在塔顶，桌上摊着三百年没人敢翻的咒文。别人忙着施法，你忙着推演——等他们摔跟头，你早把后路画好了。` },
      cyberpunk: { role: `黑市算法掮客`, description: `凌晨三点的数据黑市，你不卖币也不卖瓜，只卖一套能让对手自爆的逻辑链。客户排队，你只挑看得懂的那个。` },
    },
    en: {
      magic: { role: `Forbidden-Sigil Strategist`, description: `You live at the tower's top with scrolls nobody dares open. While others cast spells, you map the chess moves three turns ahead.` },
      cyberpunk: { role: `Black-Market Algorithm Broker`, description: `3 a.m. data markets. You sell one thing: a logic chain that quietly bricks your rival. Buyers queue; you pick one.` },
    },
  },
  INTP: {
    zh: {
      magic: { role: `失踪的炼金术理论家`, description: `你不爱施法，只爱拆原理。整个学院都在找你，你在某个山洞里跟一只会说话的蘑菇争论"魔力到底算不算粒子"。` },
      cyberpunk: { role: `地下论坛的匿名大牛`, description: `ID 没人见过，每周丢一篇神帖，把官方协议拆得稀碎。你不在乎名气，只享受"啊原来如此"那一瞬间。` },
    },
    en: {
      magic: { role: `Missing Alchemy Theorist`, description: `You skipped the lectures to argue with a talking mushroom about whether mana is a particle. The academy still has a missing-person poster up.` },
      cyberpunk: { role: `Anonymous Forum Legend`, description: `No one's seen your face. You drop one post a week that quietly dismantles a national protocol, then vanish back into the lurk.` },
    },
  },
  ENTJ: {
    zh: {
      magic: { role: `新王国的开国军师`, description: `别的国王还在比谁的王冠亮，你已经签好三国盟约、改完税法、安排好下一任继承人。会议结束所有人都松口气——你已经走了。` },
      cyberpunk: { role: `新城邦的影子市长`, description: `市长是你养的。预算、巡警班次、地铁延误，全在你 iPad 一张表里。你不上台，因为台上视野不够好。` },
    },
    en: {
      magic: { role: `Founding Strategist of a New Realm`, description: `While other kings polish their crowns, you've signed three treaties, rewritten tax law, and already chosen the next heir.` },
      cyberpunk: { role: `Shadow Mayor of a New City-State`, description: `The official mayor is your hire. Budgets, patrols, train delays — all in one spreadsheet on your tablet. You stay off-stage; the view is better.` },
    },
  },
  ENTP: {
    zh: {
      magic: { role: `把龙气死的吟游辩士`, description: `你不靠剑也不靠魔法，靠嘴。三句话让恶龙怀疑龙生，第四句让它把宝藏分一半给你保管。` },
      cyberpunk: { role: `病毒式创业鬼才`, description: `今天做 AI 占卜，明天做猫粮订阅，后天把两个一起卖。融资讲到一半灵感又来了，投资人没听完已经在转账。` },
    },
    en: {
      magic: { role: `Bard Who Talked a Dragon Down`, description: `No sword, no spell. Three sentences in, the dragon doubts its life. By sentence four, it's asking you to babysit half the hoard.` },
      cyberpunk: { role: `Serial Startup Trickster`, description: `AI tarot today, cat-food subs tomorrow, both fused by Friday. Investors wire money mid-pitch because you're already onto the next idea.` },
    },
  },
  INFJ: {
    zh: {
      magic: { role: `梦境边境的守门人`, description: `你住在现实与梦之间那道缝里，谁路过你都看一眼，知道他们三年后会变成什么样——但你只递杯热茶，不剧透。` },
      cyberpunk: { role: `情感数据库的隐居守夜人`, description: `全城人的孤独、心碎、夜里的胡思乱想都流进你看守的服务器。你不卖数据，只悄悄替最痛的那几个开一盏灯。` },
    },
    en: {
      magic: { role: `Gatekeeper of the Dream Border`, description: `You live in the seam between waking and dream. You see what each passerby becomes in three years, but only hand them tea — no spoilers.` },
      cyberpunk: { role: `Hermit Watcher of the Feels-Server`, description: `Every lonely 3 a.m. thought routes through your racks. You don't sell the data — you just dim a single light for whoever hurts most.` },
    },
  },
  INFP: {
    zh: {
      magic: { role: `森林里写诗的精灵`, description: `你不打仗、不修炼，只把每一片落叶都翻译成诗。村民笑你没用，直到某天他们读到你的诗，集体在井边哭了半小时。` },
      cyberpunk: { role: `废墟里写代码的诗人`, description: `白天送外卖，晚上在地下室写一个没人用的开源项目，但它的 README 让 GitHub 上半个亚洲的人偷偷收藏。` },
    },
    en: {
      magic: { role: `Forest Elf Who Writes Verses`, description: `You don't fight or train. You translate every fallen leaf into a poem. The village laughs — until one line of yours makes them cry by the well.` },
      cyberpunk: { role: `Poet-Coder in the Ruins`, description: `Delivery by day, basement IDE by night. Your project has zero users, but its README is quietly bookmarked by half the internet.` },
    },
  },
  ENFJ: {
    zh: {
      magic: { role: `把杂牌军带成传奇的指挥官`, description: `你接手时全队都是混子，三个月后他们愿意为你冲进火山。秘诀？你真的记得每个人妈妈的名字。` },
      cyberpunk: { role: `百万粉丝的治愈系主播`, description: `你不带货也不撕，每晚开播只是聊聊大家今天过得怎么样。弹幕飘满"妈我哭了"，平台数据怎么都解释不了你为什么火。` },
    },
    en: {
      magic: { role: `Commander Who Turned Misfits Into Legends`, description: `You inherited a band of nobodies; three months later they'd charge a volcano for you. Secret: you actually remember each one's mother's name.` },
      cyberpunk: { role: `Million-Follower Comfort Streamer`, description: `No promos, no drama. Just nightly check-ins on how everyone's doing. Chat fills with "I'm crying mom"; analytics can't explain you.` },
    },
  },
  ENFP: {
    zh: {
      magic: { role: `走到哪炸到哪的彩虹术士`, description: `你不会安静地施法。一抬手是流星雨，转身又召出会唱歌的兔子。导师血压拉满，但全镇小孩都把你画进图画书。` },
      cyberpunk: { role: `灵感外挂的内容游侠`, description: `今天直播在天台煎蛋，明天剪了部短片拿了奖。算法摸不清你下一秒去哪，但点开你的人都笑着关不掉。` },
    },
    en: {
      magic: { role: `Rainbow Sorcerer of Constant Chaos`, description: `You can't cast quietly. One wave summons a meteor shower, the next a choir of rabbits. Your mentor needs blood-pressure meds; the village kids draw you in their books.` },
      cyberpunk: { role: `Inspiration-Hack Content Ronin`, description: `Rooftop egg ASMR today, award short film tomorrow. The algorithm has no idea where you'll go next, and neither do you — but viewers can't close the tab.` },
    },
  },
  ISTJ: {
    zh: {
      magic: { role: `皇家档案馆的终身守卷人`, description: `整个王国的秘密都收在你那间木桌上。国王换了三任，你的羽毛笔尖没钝过——别人在打仗，你在保证历史不出错。` },
      cyberpunk: { role: `唯一没崩过的银行系统架构师`, description: `全城断电那天，只有你维护的那套系统一行 log 都没丢。CEO 想请你吃饭，你说不了，今晚还要例行巡检。` },
    },
    en: {
      magic: { role: `Lifelong Keeper of the Royal Archives`, description: `Every secret of the kingdom sits on your desk. Three kings have come and gone; your quill never dulled — others wage war, you keep history honest.` },
      cyberpunk: { role: `The One Banking Architect Who Never Failed`, description: `Citywide blackout — your system didn't drop a log. The CEO wants dinner; you decline, there's a scheduled audit tonight.` },
    },
  },
  ISFJ: {
    zh: {
      magic: { role: `山脚下治愈所的隐居药师`, description: `勇士们打完龙都绕路来你这儿包扎。你不收金币，只让他们带一袋邻村奶奶种的蓝莓回来——你记得每个人爱吃哪种。` },
      cyberpunk: { role: `24h 便利店的传说店长`, description: `夜班司机、加班程序员、失恋小孩都来找你。你记得每个人爱的关东煮和咖啡浓度，比他们妈还清楚。` },
    },
    en: {
      magic: { role: `Quiet Healer at the Foot of the Mountain`, description: `Heroes detour to your hut after every dragon fight. You don't take gold — just ask them to bring back blueberries from the next village. You remember everyone's favorite.` },
      cyberpunk: { role: `Legendary 24-Hour Konbini Manager`, description: `Night drivers, burnt-out coders, heartbroken kids — all show up at your counter. You remember their oden order and coffee strength better than their moms do.` },
    },
  },
  ESTJ: {
    zh: {
      magic: { role: `把混乱王国治到反弹的总督`, description: `你上任三个月，街道干净、税收准时、连小偷都按时打卡。百姓背后吐槽你严，但搬家时第一个不舍得的还是你。` },
      cyberpunk: { role: `全公司唯一能让 OKR 落地的 COO`, description: `你一开会，PPT 自动变短，废话自动消音，迟到的人自动反思。同事怕你又服你，年底奖金一栏只写一个字：你。` },
    },
    en: {
      magic: { role: `Governor Who Fixed a Broken Kingdom`, description: `Three months in: clean streets, on-time taxes, even the thieves clock in. The people grumble you're strict — and miss you most when they move away.` },
      cyberpunk: { role: `The COO Who Actually Lands the OKRs`, description: `Your meetings auto-trim slides and mute filler. Latecomers spontaneously reflect. The year-end bonus column just has your name.` },
    },
  },
  ESFJ: {
    zh: {
      magic: { role: `全村人都信赖的祭典筹办者`, description: `丰收节、婚礼、远征前夜——所有需要"人都到齐还都开心"的场合都归你。你记得每户人家忌口，连领主都问你座位怎么排。` },
      cyberpunk: { role: `公司团建唯一不被吐槽的 HRBP`, description: `你不发废问卷，只悄悄记下谁怕辣谁不喝酒。年会上每个人都笑着，连最社恐的程序员都举杯敬你一下。` },
    },
    en: {
      magic: { role: `Village's Trusted Festival Maker`, description: `Harvest feast, wedding, war eve — anything that needs everyone present and smiling is yours. The lord asks you how to seat his own table.` },
      cyberpunk: { role: `The One HRBP Nobody Complains About`, description: `No useless surveys. You just quietly note who hates spice and who doesn't drink. At the gala, even the most introverted coder toasts you.` },
    },
  },
  ISTP: {
    zh: {
      magic: { role: `深山里改装魔像的怪匠`, description: `学院禁止改造的零件，你在山里拼成了会飞的魔像。它偶尔下山买酱油，村民已经见怪不怪。` },
      cyberpunk: { role: `地下车库的赛博机师`, description: `白天没人知道你住哪，晚上整条街的机车都来找你。你话少，但拧螺丝的声音比任何安慰都让人安心。` },
    },
    en: {
      magic: { role: `Mountain Tinker of Forbidden Golems`, description: `The academy banned the parts; you built a flying golem from them anyway. It pops into the village for soy sauce now and then.` },
      cyberpunk: { role: `Underground Garage Cyber-Mechanic`, description: `Nobody knows where you live by day. By night every bike on the block rolls to you. You barely speak, but the sound of your wrench is the calmest thing in town.` },
    },
  },
  ISFP: {
    zh: {
      magic: { role: `海边小屋的色彩魔法师`, description: `你不参加大战，只把每个日落画下来。某天魔王路过看到你的画，沉默了三天，然后退休了。` },
      cyberpunk: { role: `地下展览的视觉游民`, description: `没固定工作室，灵感来了就把整面墙刷成新作品。粉丝追着你跑半个城，你只想找下一片好看的光。` },
    },
    en: {
      magic: { role: `Color-Mage of the Seaside Cottage`, description: `You skip the wars and paint every sunset. One day the Dark Lord wanders by, sees your canvas, goes quiet for three days, and retires.` },
      cyberpunk: { role: `Underground Visual Drifter`, description: `No fixed studio. When inspiration hits, you repaint a whole wall. Fans chase you across the city; you just chase the next nice slice of light.` },
    },
  },
  ESTP: {
    zh: {
      magic: { role: `赏金榜常年第一的浪子剑客`, description: `你接的任务别人三周做完，你三小时——顺便在镇上喝完一桶酒，赢了三场比武，还带回一只小狼崽。` },
      cyberpunk: { role: `极限运动直播的顶流主播`, description: `你不写脚本，跳就完事。今天 30 楼跑酷，明天潜艇盲潜，弹幕在喊"求你停下"，你在屏幕外笑。` },
    },
    en: {
      magic: { role: `Top of the Bounty Board, Wandering Blade`, description: `Quests that take others three weeks take you three hours — plus a barrel of ale, three sparring wins, and one wolf cub on the way home.` },
      cyberpunk: { role: `Top Extreme-Sports Streamer`, description: `No script. 30th-floor parkour today, blind sub dive tomorrow. Chat begs you to stop; you're laughing off-camera.` },
    },
  },
  ESFP: {
    zh: {
      magic: { role: `走到哪都开 party 的星辰歌姬`, description: `你一开嗓，连冰原上的狼都坐下来听。任务失败也没关系，反正最后大家都跟你跳了一夜舞。` },
      cyberpunk: { role: `霓虹街头的当红 livehouse 主唱`, description: `你不靠修音，靠现场。每次返场都把屋顶喊塌一次，第二天热搜照例挂着你。` },
    },
    en: {
      magic: { role: `Starlit Songstress, Party Wherever`, description: `One note from you and even tundra wolves sit down. Even a failed quest ends with everyone dancing till dawn anyway.` },
      cyberpunk: { role: `Neon-Strip Livehouse Headliner`, description: `No autotune, all live. Every encore nearly takes the roof off. Next morning the trending list has your name again.` },
    },
  },
};

const DEFAULT_KEY = "INFP";

export function getFallbackParallelUniverse(mbtiType: string, locale: string): PUEntry {
  const key = (mbtiType || "").toUpperCase();
  const entry = BANK[key] || BANK[DEFAULT_KEY];
  return locale === "zh" ? entry.zh : entry.en;
}
