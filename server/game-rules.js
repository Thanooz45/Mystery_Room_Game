export const DIFFICULTY_RULES = Object.freeze({
  easy: Object.freeze({ suspects: 3, clues: 5, hints: 2, baseScore: 100 }),
  medium: Object.freeze({ suspects: 4, clues: 7, hints: 3, baseScore: 150 }),
  hard: Object.freeze({ suspects: 5, clues: 9, hints: 3, baseScore: 200 }),
});

export function hasRequiredCounts(difficulty, counts) {
  const rules = Object.hasOwn(DIFFICULTY_RULES, difficulty) ? DIFFICULTY_RULES[difficulty] : undefined;
  return Boolean(rules)
    && counts.suspects === rules.suspects
    && counts.clues === rules.clues
    && counts.hints === rules.hints;
}

export function scoreCase({ difficulty, correct, discoveredClues, hintsUsed }) {
  const rules = Object.hasOwn(DIFFICULTY_RULES, difficulty) ? DIFFICULTY_RULES[difficulty] : undefined;
  if (!rules) throw new Error('Unknown case difficulty.');
  if (!Number.isInteger(discoveredClues) || discoveredClues < 0 || discoveredClues > rules.clues) {
    throw new Error('Discovered clue count is invalid.');
  }
  if (!Number.isInteger(hintsUsed) || hintsUsed < 0 || hintsUsed > rules.hints) {
    throw new Error('Hints used count is invalid.');
  }

  const base = correct ? rules.baseScore : 0;
  const cluePoints = discoveredClues * 5;
  const hintPenalty = hintsUsed * 10;

  return {
    total: Math.max(0, base + cluePoints - hintPenalty),
    base,
    cluePoints,
    hintPenalty,
    discoveredClues,
    hintsUsed,
  };
}
