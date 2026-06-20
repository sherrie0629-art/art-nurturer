const ZH_NAMES: Record<string, string> = {
  Aries: "白羊座",
  Taurus: "金牛座",
  Gemini: "双子座",
  Cancer: "巨蟹座",
  Leo: "狮子座",
  Virgo: "处女座",
  Libra: "天秤座",
  Scorpio: "天蝎座",
  Sagittarius: "射手座",
  Capricorn: "摩羯座",
  Aquarius: "水瓶座",
  Pisces: "双鱼座",
};

const ZH_ELEMENTS: Record<string, string> = {
  Fire: "火象",
  Earth: "土象",
  Air: "风象",
  Water: "水象",
};

const ZODIAC_ICONS: Record<string, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

export function localizeZodiacName(name: string, isZh: boolean): string {
  return isZh ? ZH_NAMES[name] || name : name;
}

export function localizeZodiacElement(element: string, isZh: boolean): string {
  return isZh ? ZH_ELEMENTS[element] || element : element;
}

export function getZodiacIcon(signName: string): string {
  return ZODIAC_ICONS[signName] || "⭐";
}
