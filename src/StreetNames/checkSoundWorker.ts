/// <reference lib="webworker" />

import doubleMetaphone from "talisman/phonetics/double-metaphone";
import levenshtein from "talisman/metrics/levenshtein";

type PhoneticCode = [string, string | null];

interface SimilarStreet {
  streetname: string;
  similar: boolean;
  matchRatio: number;
  normalizedDistance: number;
}

let cachedStreetList: string[] = [];

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

const streetsSoundSimilar = (name1: string, name2: string): SimilarStreet => {
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

  if (normalizedDistance > 0.4) {
    return {
      streetname: name2,
      similar: false,
      matchRatio: 0,
      normalizedDistance,
    };
  }

  const words1 = getPhoneticWords(normalized1);
  const words2 = getPhoneticWords(normalized2);

  // First words must match
  const firstWordMatch = codesMatch(words1[0], words2[0]);

  // Remaining words: loose any-to-any match
  const remaining1 = words1.slice(1);
  const remaining2 = words2.slice(1);

  let looseMatch = false;
  for (const code1 of remaining1) {
    for (const code2 of remaining2) {
      if (codesMatch(code1, code2)) {
        looseMatch = true;
        break;
      }
    }
    if (looseMatch) break;
  }

  const phoneticMatch = firstWordMatch && (remaining1.length === 0 || looseMatch);

  const similar =
    (phoneticMatch && normalizedDistance <= 0.35) ||
    (firstWordMatch && normalizedDistance <= 0.25); // safety net

  return {
    streetname: name2,
    similar,
    matchRatio: phoneticMatch ? 1 : 0,
    normalizedDistance,
  };
};


// Web worker handler
self.onmessage = (e) => {
  const { type } = e.data;

  if (type === "init") {
    cachedStreetList = e.data.streetList;
    return;
  }

  if (type === "check") {
    const { id, inputName } = e.data;

    const match = cachedStreetList
      .map((street) => streetsSoundSimilar(inputName, street))
      .find((result) => result.similar);

    self.postMessage({ id, match });
  }
};

export {};
