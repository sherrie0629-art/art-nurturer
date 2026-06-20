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

const ZH_DATES: Record<string, string> = {
  Aries: "3.21 – 4.19",
  Taurus: "4.20 – 5.20",
  Gemini: "5.21 – 6.21",
  Cancer: "6.22 – 7.22",
  Leo: "7.23 – 8.22",
  Virgo: "8.23 – 9.22",
  Libra: "9.23 – 10.23",
  Scorpio: "10.24 – 11.22",
  Sagittarius: "11.23 – 12.21",
  Capricorn: "12.22 – 1.19",
  Aquarius: "1.20 – 2.18",
  Pisces: "2.19 – 3.20",
};

const EN_DATES: Record<string, string> = {
  Aries: "Mar 21 – Apr 19",
  Taurus: "Apr 20 – May 20",
  Gemini: "May 21 – Jun 21",
  Cancer: "Jun 22 – Jul 22",
  Leo: "Jul 23 – Aug 22",
  Virgo: "Aug 23 – Sep 22",
  Libra: "Sep 23 – Oct 23",
  Scorpio: "Oct 24 – Nov 22",
  Sagittarius: "Nov 23 – Dec 21",
  Capricorn: "Dec 22 – Jan 19",
  Aquarius: "Jan 20 – Feb 18",
  Pisces: "Feb 19 – Mar 20",
};

export const ZODIAC_SIGNS = [
  { name: "Aries", icon: "♈", element: "Fire" as const },
  { name: "Taurus", icon: "♉", element: "Earth" as const },
  { name: "Gemini", icon: "♊", element: "Air" as const },
  { name: "Cancer", icon: "♋", element: "Water" as const },
  { name: "Leo", icon: "♌", element: "Fire" as const },
  { name: "Virgo", icon: "♍", element: "Earth" as const },
  { name: "Libra", icon: "♎", element: "Air" as const },
  { name: "Scorpio", icon: "♏", element: "Water" as const },
  { name: "Sagittarius", icon: "♐", element: "Fire" as const },
  { name: "Capricorn", icon: "♑", element: "Earth" as const },
  { name: "Aquarius", icon: "♒", element: "Air" as const },
  { name: "Pisces", icon: "♓", element: "Water" as const },
];

export type ZodiacElement = (typeof ZODIAC_SIGNS)[number]["element"];

export function localizeZodiacDate(name: string, isZh: boolean): string {
  return isZh ? ZH_DATES[name] || name : EN_DATES[name] || name;
}

export function localizeZodiacName(name: string, isZh: boolean): string {
  return isZh ? ZH_NAMES[name] || name : name;
}

export function localizeZodiacElement(element: string, isZh: boolean): string {
  return isZh ? ZH_ELEMENTS[element] || element : element;
}

export function getZodiacIcon(signName: string): string {
  return ZODIAC_ICONS[signName] || "⭐";
}
