export const wordLists = {
  uk: {
    easy: [
      { word: 'KIT', emoji: '\uD83D\uDC31' },
      { word: 'DIM', emoji: '\uD83C\uDFE0' },
      { word: 'SON', emoji: '\uD83D\uDE34' },
      { word: 'MAK', emoji: '\uD83C\uDF3A' },
      { word: 'LIS', emoji: '\uD83E\uDD8A' },
      { word: 'SYR', emoji: '\uD83E\uDDC0' },
      { word: 'NIS', emoji: '\uD83D\uDC43' },
      { word: 'MIR', emoji: '\u2728' },
      { word: 'RIK', emoji: '\uD83D\uDCC5' },
      { word: 'LIK', emoji: '\uD83D\uDC8A' },
    ],
    medium: [
      { word: 'KOTYK', emoji: '\uD83D\uDC31' },
      { word: 'SONTSE', emoji: '\u2600\uFE0F' },
      { word: 'KVITKA', emoji: '\uD83C\uDF3C' },
      { word: 'LIZHKO', emoji: '\uD83D\uDECF\uFE0F' },
      { word: 'MISIATS', emoji: '\uD83C\uDF19' },
      { word: 'ZIRKA', emoji: '\u2B50' },
    ],
    hard: [
      { word: 'CHEREPAKHA', emoji: '\uD83D\uDC22' },
      { word: 'METELYK', emoji: '\uD83E\uDD8B' },
      { word: 'SONIASHNYK', emoji: '\uD83C\uDF3B' },
      { word: 'MOROZYVO', emoji: '\uD83C\uDF66' },
      { word: 'VEDMEDYK', emoji: '\uD83D\uDC3B' },
    ],
  },
  en: {
    easy: [
      { word: 'CAT', emoji: '\uD83D\uDC31' },
      { word: 'DOG', emoji: '\uD83D\uDC36' },
      { word: 'SUN', emoji: '\u2600\uFE0F' },
      { word: 'HAT', emoji: '\uD83E\uDDE2' },
      { word: 'CUP', emoji: '\u2615' },
      { word: 'BED', emoji: '\uD83D\uDECF\uFE0F' },
      { word: 'JAM', emoji: '\uD83C\uDF53' },
      { word: 'PIG', emoji: '\uD83D\uDC37' },
      { word: 'BUS', emoji: '\uD83D\uDE8C' },
      { word: 'FAN', emoji: '\uD83C\uDF2C\uFE0F' },
    ],
    medium: [
      { word: 'HOUSE', emoji: '\uD83C\uDFE0' },
      { word: 'APPLE', emoji: '\uD83C\uDF4E' },
      { word: 'WATER', emoji: '\uD83D\uDCA7' },
      { word: 'HAPPY', emoji: '\uD83D\uDE04' },
      { word: 'TRAIN', emoji: '\uD83D\uDE82' },
      { word: 'CLOUD', emoji: '\u2601\uFE0F' },
    ],
    hard: [
      { word: 'RAINBOW', emoji: '\uD83C\uDF08' },
      { word: 'DOLPHIN', emoji: '\uD83D\uDC2C' },
      { word: 'BUTTERFLY', emoji: '\uD83E\uDD8B' },
      { word: 'ELEPHANT', emoji: '\uD83D\uDC18' },
      { word: 'BIRTHDAY', emoji: '\uD83C\uDF82' },
    ],
  },
};

/* Map English words back to Ukrainian display and vice-versa.
   The `word` field in each entry uses transliterated Latin keys
   so the actual Cyrillic display text lives here. */
export const cyrillicMap = {
  KIT: '\u041A\u0406\u0422',
  DIM: '\u0414\u0406\u041C',
  SON: '\u0421\u041E\u041D',
  MAK: '\u041C\u0410\u041A',
  LIS: '\u041B\u0406\u0421',
  SYR: '\u0421\u0418\u0420',
  NIS: '\u041D\u0406\u0421',
  MIR: '\u041C\u0406\u0420',
  RIK: '\u0420\u0406\u041A',
  LIK: '\u041B\u0406\u041A',
  KOTYK: '\u041A\u041E\u0422\u0418\u041A',
  SONTSE: '\u0421\u041E\u041D\u0426\u0415',
  KVITKA: '\u041A\u0412\u0406\u0422\u041A\u0410',
  LIZHKO: '\u041B\u0406\u0416\u041A\u041E',
  MISIATS: '\u041C\u0406\u0421\u042F\u0426\u042C',
  ZIRKA: '\u0417\u0406\u0420\u041A\u0410',
  CHEREPAKHA: '\u0427\u0415\u0420\u0415\u041F\u0410\u0425\u0410',
  METELYK: '\u041C\u0415\u0422\u0415\u041B\u0418\u041A',
  SONIASHNYK: '\u0421\u041E\u041D\u042F\u0428\u041D\u0418\u041A',
  MOROZYVO: '\u041C\u041E\u0420\u041E\u0417\u0418\u0412\u041E',
  VEDMEDYK: '\u0412\u0415\u0414\u041C\u0415\u0414\u0418\u041A',
};

/**
 * Returns the display word (Cyrillic for uk, Latin for en).
 */
export function getDisplayWord(entry, locale) {
  if (locale === 'uk') {
    return cyrillicMap[entry.word] || entry.word;
  }
  return entry.word;
}

/**
 * Returns the letters of the display word as an array.
 */
export function getLetters(entry, locale) {
  return getDisplayWord(entry, locale).split('');
}
