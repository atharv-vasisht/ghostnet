import type { Asset } from './session.js';

export interface BeliefState {
  sessionId: string;
  inferredGoal: GoalInference;
  confidenceScore: number;
  explorationPath: string[];
  discoveredAssets: Asset[];
  currentDepth: number;
}

export interface GoalInference {
  goal: string;
  confidence: number;
  evidence: string;
}

export interface GoalPattern {
  goal: string;
  confidence: number;
  evidence: string;
  match: boolean;
}
