import doubleMetaphone from 'talisman/phonetics/double-metaphone';
import levenshtein from 'talisman/metrics/levenshtein';

// Type for phonetic code tuple
type PhoneticCode = [string, string | null];

// Get phonetic codes for a single word
const getCodes = (word: string): PhoneticCode => doubleMetaphone(word);

// Get phonetic codes for all words in a street name
const getPhoneticWords = (name: string): PhoneticCode[] =>
  name.toLowerCase().split(/\s+/).map(getCodes);

// Check if two phonetic codes match
const codesMatch = (code1: PhoneticCode, code2: PhoneticCode): boolean =>
  code1[0] === code2[0] ||
  code1[0] === code2[1] ||
  code1[1] === code2[0] ||
  code1[1] === code2[1];

// Main function: check if two street names sound similar
export const streetsSoundSimilar = (
  name1: string,
  name2: string,
  wordMatchThreshold = .1,
  maxEditDistance = 1
): boolean => {
    
  if (name1.split(' ').length > 1 || name2.split(' ').length > 1) {
    maxEditDistance = 2;
  }
  const words1 = getPhoneticWords(name1);
  const words2 = getPhoneticWords(name2);
  const matchedWords = words1.filter(code1 =>
    words2.some(code2 => codesMatch(code1, code2))
  ).length;

  const longerLength = Math.max(words1.length, words2.length);
  const matchRatio = matchedWords / longerLength;

  const editDistance = levenshtein(name1.toLowerCase(), name2.toLowerCase());

  return matchRatio >= wordMatchThreshold && editDistance <= maxEditDistance;
};