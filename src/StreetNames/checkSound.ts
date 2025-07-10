import doubleMetaphone from 'talisman/phonetics/double-metaphone';
import levenshtein from 'talisman/metrics/levenshtein';

type PhoneticCode = [string, string | null];

const getCodes = (word: string): PhoneticCode => doubleMetaphone(word);

const getPhoneticWords = (name: string): PhoneticCode[] =>
  name.trim().toLowerCase().split(/\s+/).map(getCodes);

const codesMatch = (code1: PhoneticCode, code2: PhoneticCode): boolean =>
  code1.some(c1 => c1 && code2.includes(c1));

// Collapse into a single string for comparison
const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

export const streetsSoundSimilar = (
  name1: string,
  name2: string,
  wordMatchThreshold = 0.5
): boolean => {
  const normalized1 = name1.trim().toLowerCase();
  const normalized2 = name2.trim().toLowerCase();

  const joined1 = normalize(name1);
  const joined2 = normalize(name2);

  const editDistance = levenshtein(joined1, joined2);
  const normalizedDistance = editDistance / Math.max(joined1.length, joined2.length);

  // Phonetic word-by-word comparison
  const words1 = getPhoneticWords(normalized1);
  const words2 = getPhoneticWords(normalized2);

  const matchedWords = words1.filter(code1 =>
    words2.some(code2 => codesMatch(code1, code2))
  ).length;

  const matchRatio = matchedWords / Math.max(words1.length, words2.length);

  // First word stronger match check
  const firstWord1 = getCodes(normalized1.split(/\s+/)[0]);
  const firstWord2 = getCodes(normalized2.split(/\s+/)[0]);
  const firstWordsSimilar = codesMatch(firstWord1, firstWord2);

  return firstWordsSimilar && matchRatio >= wordMatchThreshold && normalizedDistance <= 0.25;
};
