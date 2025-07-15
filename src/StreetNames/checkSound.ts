import doubleMetaphone from "talisman/phonetics/double-metaphone";
import levenshtein from "talisman/metrics/levenshtein";
import type { SimilarStreet } from "../types/types/types";

type PhoneticCode = [string, string | null];

const getCodes = (word: string): PhoneticCode => doubleMetaphone(word);

const getPhoneticWords = (name: string): PhoneticCode[] =>
  name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .map(getCodes);

const codesMatch = (code1: PhoneticCode, code2: PhoneticCode): boolean =>
  code1.some((c1) => c1 && code2.includes(c1));

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "");

export const streetsSoundSimilar = (
  name1: string,
  name2: string,
  wordMatchThreshold = 0.5
): SimilarStreet => {
  const normalized1 = name1.trim().toLowerCase();
  const normalized2 = name2.trim().toLowerCase();

  if (normalized1.length < 3 || normalized2.length < 3) {
    return {
      streetname: name2,
      similar: false,
      matchRatio: 0,
      normalizedDistance: 1,
    };
  }

  const joined1 = normalize(name1);
  const joined2 = normalize(name2);

  const editDistance = levenshtein(joined1, joined2);
  const normalizedDistance =
    editDistance / Math.max(joined1.length, joined2.length);

  const words1 = getPhoneticWords(normalized1);
  const words2 = getPhoneticWords(normalized2);

  // Stop on first phonetic word match:
  let foundMatch = false;
  for (const code1 of words1) {
    for (const code2 of words2) {
      if (codesMatch(code1, code2)) {
        foundMatch = true;
        break;
      }
    }
    if (foundMatch) break;
  }

  // For matchRatio, if stopping early, you can just set it to 1 if a match found, else 0
  const matchRatio = foundMatch ? 1 : 0;

  const firstWord1Str = normalized1.split(/\s+/)[0];
  const firstWord2Str = normalized2.split(/\s+/)[0];

  let firstWordsSimilar = false;
  if (firstWord1Str.length > 2 && firstWord2Str.length > 2) {
    const firstWord1 = getCodes(firstWord1Str);
    const firstWord2 = getCodes(firstWord2Str);
    firstWordsSimilar = codesMatch(firstWord1, firstWord2);
  }

  const allowLooserEditDistance = firstWordsSimilar && matchRatio > 0.75;

  const similar =
    (firstWordsSimilar &&
      matchRatio >= wordMatchThreshold &&
      normalizedDistance <= 0.25) ||
    (allowLooserEditDistance && normalizedDistance <= 0.35);

  return {
    streetname: name2,
    similar,
    matchRatio,
    normalizedDistance,
  };
};
