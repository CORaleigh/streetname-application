// types/talisman.d.ts
declare module 'talisman/phonetics/metaphone' {
  const metaphone: (str: string) => string;
  export default metaphone;
}

declare module 'talisman/phonetics/double-metaphone' {
  const doubleMetaphone: (input: string) => [string, string | null];
  export default doubleMetaphone;
}

declare module 'talisman/metrics/levenshtein' {
  const levenshtein: (a: string, b: string) => number;
  export default levenshtein;
}