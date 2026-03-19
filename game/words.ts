import type { Locale } from "@/utils/i18n";

/**
 * Unified word table — each entry has translations in all 3 languages.
 * When a player guesses, ANY language version is accepted as correct.
 */
export interface WordEntry {
  en: string;
  uz: string;
  ru: string;
}

export const WORD_ENTRIES: WordEntry[] = [
  { en: "astronaut",       uz: "kosmonavt",          ru: "космонавт" },
  { en: "backpack",        uz: "ryukzak",             ru: "рюкзак" },
  { en: "balloon",         uz: "havo shari",          ru: "воздушный шар" },
  { en: "banana",          uz: "banan",               ru: "банан" },
  { en: "bicycle",         uz: "velosiped",           ru: "велосипед" },
  { en: "birthday cake",   uz: "tort",                ru: "торт" },
  { en: "book",            uz: "kitob",               ru: "книга" },
  { en: "butterfly",       uz: "kapalak",             ru: "бабочка" },
  { en: "camera",          uz: "kamera",              ru: "фотоаппарат" },
  { en: "campfire",        uz: "gulxan",              ru: "костёр" },
  { en: "candle",          uz: "sham",                ru: "свеча" },
  { en: "castle",          uz: "qal'a",               ru: "замок" },
  { en: "chessboard",      uz: "shaxmat",             ru: "шахматы" },
  { en: "clock",           uz: "soat",                ru: "часы" },
  { en: "cloud",           uz: "bulut",               ru: "облако" },
  { en: "coconut",         uz: "hindiqo'z",           ru: "кокос" },
  { en: "compass",         uz: "kompas",              ru: "компас" },
  { en: "cookie",          uz: "pechenye",            ru: "печенье" },
  { en: "cucumber",        uz: "bodring",             ru: "огурец" },
  { en: "dinosaur",        uz: "dinozavr",            ru: "динозавр" },
  { en: "dragon fruit",    uz: "drakon mevasi",       ru: "питахайя" },
  { en: "drum",            uz: "baraban",             ru: "барабан" },
  { en: "elevator",        uz: "lift",                ru: "лифт" },
  { en: "fireworks",       uz: "feyrverki",           ru: "фейерверк" },
  { en: "fountain",        uz: "favvora",             ru: "фонтан" },
  { en: "giraffe",         uz: "jirafa",              ru: "жираф" },
  { en: "guitar",          uz: "gitara",              ru: "гитара" },
  { en: "hamburger",       uz: "gamburger",           ru: "гамбургер" },
  { en: "headphones",      uz: "quloqchin",           ru: "наушники" },
  { en: "helicopter",      uz: "vertolyot",           ru: "вертолёт" },
  { en: "ice cream",       uz: "muzqaymoq",           ru: "мороженое" },
  { en: "island",          uz: "orol",                ru: "остров" },
  { en: "jellyfish",       uz: "meduza",              ru: "медуза" },
  { en: "kangaroo",        uz: "kenguru",             ru: "кенгуру" },
  { en: "keyboard",        uz: "klaviatura",          ru: "клавиатура" },
  { en: "kite",            uz: "varrak",              ru: "воздушный змей" },
  { en: "lantern",         uz: "fonar",               ru: "фонарь" },
  { en: "lighthouse",      uz: "mayak",               ru: "маяк" },
  { en: "magnet",          uz: "magnit",              ru: "магнит" },
  { en: "microphone",      uz: "mikrofon",            ru: "микрофон" },
  { en: "moon",            uz: "oy",                  ru: "луна" },
  { en: "mountain",        uz: "tog'",                ru: "гора" },
  { en: "museum",          uz: "muzey",               ru: "музей" },
  { en: "noodles",         uz: "makaron",             ru: "лапша" },
  { en: "octopus",         uz: "osminog",             ru: "осьминог" },
  { en: "pancakes",        uz: "krep",                ru: "блины" },
  { en: "parachute",       uz: "parashyut",           ru: "парашют" },
  { en: "peacock",         uz: "tovus",               ru: "павлин" },
  { en: "pencil",          uz: "qalam",               ru: "карандаш" },
  { en: "piano",           uz: "pianino",             ru: "пианино" },
  { en: "pineapple",       uz: "ananas",              ru: "ананас" },
  { en: "popcorn",         uz: "popkorn",             ru: "попкорн" },
  { en: "pomegranate",     uz: "anor",                ru: "гранат" },
  { en: "pumpkin",         uz: "qovoq",               ru: "тыква" },
  { en: "rainbow",         uz: "kamalak",             ru: "радуга" },
  { en: "robot",           uz: "robot",               ru: "робот" },
  { en: "rocket",          uz: "raketa",              ru: "ракета" },
  { en: "sailboat",        uz: "yelkanli qayiq",      ru: "парусная лодка" },
  { en: "school bus",      uz: "maktab avtobusi",     ru: "школьный автобус" },
  { en: "snow globe",      uz: "qor shari",           ru: "снежный шар" },
  { en: "spaceship",       uz: "kosmik kema",         ru: "космический корабль" },
  { en: "stork",           uz: "laylak",              ru: "аист" },
  { en: "strawberry",      uz: "qulupnay",            ru: "клубника" },
  { en: "submarine",       uz: "suv osti kemasi",     ru: "подводная лодка" },
  { en: "sun",             uz: "quyosh",              ru: "солнце" },
  { en: "sunflower",       uz: "kungaboqar",          ru: "подсолнух" },
  { en: "sushi",           uz: "sushi",               ru: "суши" },
  { en: "teapot",          uz: "choynak",             ru: "чайник" },
  { en: "telescope",       uz: "teleskop",            ru: "телескоп" },
  { en: "thunderstorm",    uz: "bo'ron",              ru: "гроза" },
  { en: "toothbrush",      uz: "tish cho'tkasi",      ru: "зубная щётка" },
  { en: "tractor",         uz: "traktor",             ru: "трактор" },
  { en: "treasure map",    uz: "xazina xaritasi",     ru: "карта сокровищ" },
  { en: "unicorn",         uz: "yakshox",             ru: "единорог" },
  { en: "volcano",         uz: "vulkan",              ru: "вулкан" },
  { en: "waffles",         uz: "vafl",                ru: "вафли" },
  { en: "waterfall",       uz: "sharshara",           ru: "водопад" },
  { en: "windmill",        uz: "shamol tegirmoni",    ru: "ветряная мельница" },
  { en: "wizard",          uz: "sehrgar",             ru: "волшебник" },
  { en: "yogurt",          uz: "qatiq",               ru: "йогурт" },
  { en: "zeppelin",        uz: "dirijbl",             ru: "дирижабль" },
  { en: "airplane",        uz: "samolyot",            ru: "самолёт" },
  { en: "bakery",          uz: "nonvoyxona",          ru: "пекарня" },
  { en: "football",        uz: "futbol to'pi",        ru: "футбольный мяч" },
  { en: "soup",            uz: "sho'rva",             ru: "суп" },
  { en: "phone",           uz: "telefon",             ru: "телефон" },
  { en: "mirror",          uz: "oyna",                ru: "зеркало" },
  { en: "ship",            uz: "kema",                ru: "корабль" },
  { en: "hat",             uz: "qalpoq",              ru: "шляпа" },
  { en: "carpet",          uz: "gilam",               ru: "ковёр" },
  { en: "chess",           uz: "shaxmat",             ru: "шахматы" },
  { en: "watermelon",      uz: "tarvuz",              ru: "арбуз" },
  { en: "flower",          uz: "gul",                 ru: "цветок" },
  { en: "tree",            uz: "daraxt",              ru: "дерево" },
  { en: "cat",             uz: "mushuk",              ru: "кошка" },
  { en: "dog",             uz: "it",                  ru: "собака" },
  { en: "fish",            uz: "baliq",               ru: "рыба" },
  { en: "bird",            uz: "qush",                ru: "птица" },
  { en: "horse",           uz: "ot",                  ru: "лошадь" },
  { en: "elephant",        uz: "fil",                 ru: "слон" },
  { en: "lion",            uz: "arslon",              ru: "лев" },
  { en: "tiger",           uz: "yo'lbars",            ru: "тигр" },
  { en: "bear",            uz: "ayiq",                ru: "медведь" },
  { en: "snake",           uz: "ilon",                ru: "змея" },
  { en: "frog",            uz: "qurbaqa",             ru: "лягушка" },
  { en: "apple",           uz: "olma",                ru: "яблоко" },
  { en: "orange",          uz: "apelsin",             ru: "апельсин" },
  { en: "grapes",          uz: "uzum",                ru: "виноград" },
  { en: "cherry",          uz: "gilos",               ru: "вишня" },
  { en: "house",           uz: "uy",                  ru: "дом" },
  { en: "bridge",          uz: "ko'prik",             ru: "мост" },
  { en: "train",           uz: "poyezd",              ru: "поезд" },
  { en: "car",             uz: "mashina",             ru: "машина" },
  { en: "ship anchor",     uz: "langar",              ru: "якорь" },
  { en: "crown",           uz: "toj",                 ru: "корона" },
  { en: "key",             uz: "kalit",               ru: "ключ" },
  { en: "lamp",            uz: "chiroq",              ru: "лампа" },
  { en: "chair",           uz: "stul",                ru: "стул" },
  { en: "table",           uz: "stol",                ru: "стол" },
  { en: "bed",             uz: "karavot",             ru: "кровать" },
  { en: "door",            uz: "eshik",               ru: "дверь" },
  { en: "window",          uz: "deraza",              ru: "окно" },
  { en: "glasses",         uz: "ko'zoynak",           ru: "очки" },
  { en: "umbrella",        uz: "soyabon",             ru: "зонт" },
  { en: "ring",            uz: "uzuk",                ru: "кольцо" },
  { en: "watch",           uz: "qo'l soati",          ru: "наручные часы" },
  { en: "bottle",          uz: "shisha",              ru: "бутылка" },
  { en: "cup",             uz: "piyola",              ru: "чашка" },
  { en: "knife",           uz: "pichoq",              ru: "нож" },
  { en: "scissors",        uz: "qaychi",              ru: "ножницы" },
  { en: "brush",           uz: "mo'yqalam",           ru: "кисть" },
  { en: "cloud castle",    uz: "bulutdagi qal'a",     ru: "замок в облаках" },
  { en: "basketball",      uz: "basketbol",           ru: "баскетбол" },
  { en: "tennis",          uz: "tennis",              ru: "теннис" },
  { en: "swimming",        uz: "suzish",              ru: "плавание" },
];

/** Word banks per locale, derived from unified entries */
export const WORD_BANKS: Record<Locale, string[]> = {
  en: WORD_ENTRIES.map((e) => e.en),
  uz: WORD_ENTRIES.map((e) => e.uz),
  ru: WORD_ENTRIES.map((e) => e.ru),
};

/**
 * Get all translations of a word (used to store multiple valid hashes).
 * Searches all entries for a match in any language, then returns all 3 versions.
 */
export function getAllTranslations(word: string): string[] {
  const normalized = word.trim().toLowerCase();
  const entry = WORD_ENTRIES.find(
    (e) =>
      e.en.toLowerCase() === normalized ||
      e.uz.toLowerCase() === normalized ||
      e.ru.toLowerCase() === normalized
  );

  if (!entry) {
    // Unknown word — only accept exact match
    return [word];
  }

  // Return all unique non-empty translations
  return [...new Set([entry.en, entry.uz, entry.ru].filter(Boolean))];
}
