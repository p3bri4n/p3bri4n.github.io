export type Complexity = 'low' | 'medium' | 'high';

// Mots lus par minute : un contenu technique/dense se lit plus lentement.
const WORDS_PER_MINUTE: Record<Complexity, number> = {
  low: 238,
  medium: 200,
  high: 150,
};

export function getReadingTime(body: string, complexity: Complexity = 'medium'): number {
  const wordCount = body.trim().split(/\s+/).filter(Boolean).length;
  const wpm = WORDS_PER_MINUTE[complexity];
  return Math.max(1, Math.round(wordCount / wpm));
}
