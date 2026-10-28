import test from 'node:test';
import assert from 'node:assert/strict';
import { generatedSchema } from './mystery.js';

function generatedCase({ difficulty, suspectCount, clueCount, hintCount }) {
  const suspectIds = Array.from({ length: suspectCount }, (_, index) => `suspect_${index + 1}`);
  const evidence = Array.from({ length: clueCount }, (_, index) => ({
    id: `evidence_${index + 1}`,
    title: `Evidence ${index + 1}`,
    type: 'document',
    category: 'physical',
    description: 'A fictional document included in the investigation.',
    createdAt: '2026-01-01T10:00:00.000Z',
    sourceLabel: 'Fictional simulated document',
    suspectIds: [suspectIds[0]],
    timelineEventIds: ['event_1'],
    content: { text: 'A fictional document detail.' },
    provenance: {
      origin: 'ai_generated',
      provider: 'Gemini',
      model: 'test',
      createdAt: '2026-01-01T10:00:00.000Z',
      fictional: true,
      displayLabel: 'Fictional AI-generated evidence',
    },
    clueRole: index < 2 ? 'decisive' : 'contextual',
    fictional: true,
  }));
  const hints = Array.from({ length: hintCount }, (_, index) => `This is a fictional hint number ${index + 1}.`);

  return {
    schemaVersion: '1.0',
    title: 'The Quiet Archive',
    difficulty,
    tone: 'classic_detective',
    length: 'standard',
    premise: 'A fictional archive loses a valuable ledger during a quiet evening.',
    incident: {
      summary: 'A ledger disappeared from a locked archive room.',
      location: 'The city archive',
      discoveredAt: '2026-01-01T10:00:00.000Z',
      incidentType: 'theft',
    },
    suspects: suspectIds.map((id, index) => ({
      id,
      name: `Suspect ${index + 1}`,
      role: 'Archive visitor',
      background: 'A fictional visitor with a reason to be nearby.',
      motive: 'They wanted to conceal a fictional mistake.',
      alibi: { statement: 'They were in the reading room.', verified: false },
      initialSuspicion: 'medium',
    })),
    timeline: Array.from({ length: 3 }, (_, index) => ({
      id: `event_${index + 1}`,
      timestamp: `2026-01-01T${String(10 + index).padStart(2, '0')}:00:00.000Z`,
      description: 'A fictional event in the archive timeline.',
      suspectIds,
      evidenceIds: [`evidence_${index + 1}`],
      eventType: 'observed_fact',
    })),
    evidence,
    solution: {
      culpritId: suspectIds[0],
      motive: 'The culprit wanted to hide a fictional mistake.',
      method: 'The culprit used a copied key to access the room.',
      chronology: [
        { timestamp: '2026-01-01T10:00:00.000Z', description: 'The culprit entered the archive.' },
        { timestamp: '2026-01-01T11:00:00.000Z', description: 'The ledger was removed from its cabinet.' },
      ],
      decisiveEvidenceIds: ['evidence_1', 'evidence_2'],
      reasoning: 'The decisive documents establish when the room was entered and who had access.',
      redHerringExplanations: [],
      hints,
    },
  };
}

test('generated mystery schema accepts exact easy-mode counts', () => {
  assert.equal(generatedSchema.safeParse(generatedCase({
    difficulty: 'easy',
    suspectCount: 3,
    clueCount: 5,
    hintCount: 2,
  })).success, true);
});

test('generated mystery schema rejects output that misses the selected difficulty counts', () => {
  const mystery = generatedCase({ difficulty: 'medium', suspectCount: 4, clueCount: 7, hintCount: 3 });
  mystery.evidence.pop();
  assert.equal(generatedSchema.safeParse(mystery).success, false);
});
