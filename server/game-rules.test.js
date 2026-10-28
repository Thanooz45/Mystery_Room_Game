import test from 'node:test';
import assert from 'node:assert/strict';
import { DIFFICULTY_RULES, hasRequiredCounts, scoreCase } from './game-rules.js';

test('difficulty levels use the required suspect, clue, hint, and base score counts', () => {
  assert.deepEqual(DIFFICULTY_RULES.easy, { suspects: 3, clues: 5, hints: 2, baseScore: 100 });
  assert.deepEqual(DIFFICULTY_RULES.medium, { suspects: 4, clues: 7, hints: 3, baseScore: 150 });
  assert.deepEqual(DIFFICULTY_RULES.hard, { suspects: 5, clues: 9, hints: 3, baseScore: 200 });
});

test('generated mystery counts must exactly match the selected difficulty', () => {
  assert.equal(hasRequiredCounts('easy', { suspects: 3, clues: 5, hints: 2 }), true);
  assert.equal(hasRequiredCounts('medium', { suspects: 4, clues: 7, hints: 3 }), true);
  assert.equal(hasRequiredCounts('hard', { suspects: 5, clues: 9, hints: 3 }), true);
  assert.equal(hasRequiredCounts('easy', { suspects: 4, clues: 5, hints: 2 }), false);
  assert.equal(hasRequiredCounts('hard', { suspects: 5, clues: 8, hints: 3 }), false);
  assert.equal(hasRequiredCounts('__proto__', { suspects: 4, clues: 5, hints: 2 }), false);
});

test('correct accusations receive difficulty points and clue/hint adjustments', () => {
  assert.deepEqual(scoreCase({ difficulty: 'easy', correct: true, discoveredClues: 4, hintsUsed: 1 }), {
    total: 110,
    base: 100,
    cluePoints: 20,
    hintPenalty: 10,
    discoveredClues: 4,
    hintsUsed: 1,
  });
});

test('incorrect accusations do not earn the correct-accusation bonus', () => {
  assert.equal(scoreCase({ difficulty: 'medium', correct: false, discoveredClues: 7, hintsUsed: 3 }).total, 5);
});

test('the score cannot drop below zero', () => {
  assert.equal(scoreCase({ difficulty: 'easy', correct: false, discoveredClues: 0, hintsUsed: 2 }).total, 0);
});

test('invalid game state cannot be scored', () => {
  assert.throws(() => scoreCase({ difficulty: 'easy', correct: true, discoveredClues: 6, hintsUsed: 0 }));
  assert.throws(() => scoreCase({ difficulty: 'hard', correct: true, discoveredClues: 1, hintsUsed: 4 }));
  assert.throws(() => scoreCase({ difficulty: '__proto__', correct: true, discoveredClues: 1, hintsUsed: 0 }));
});
