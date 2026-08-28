import { CountingSystemKey } from './systems';

export type CountingPracticeMode = 'RUNNING_COUNT' | 'TRUE_COUNT';

export interface RecordCountingSessionPayload {
  system: CountingSystemKey;
  practiceMode: CountingPracticeMode;
  level: number;
  deckCount: number;
  cardsSeen: number;
  checkpoints: number;
  correctCheckpoints: number;
  avgAbsoluteError: number;
}
