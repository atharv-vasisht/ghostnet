import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import type { BeliefState } from '@ghostnet/shared';

export function useBeliefState(sessionId: string | undefined) {
  const { subscribe } = useSocket();
  const [beliefState, setBeliefState] = useState<BeliefState | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribe<{
      sessionId: string;
      beliefState: BeliefState;
    }>('belief:updated', (payload) => {
      if (payload.sessionId === sessionId) {
        setBeliefState(payload.beliefState);
      }
    });

    return unsubscribe;
  }, [sessionId, subscribe]);

  return beliefState;
}
