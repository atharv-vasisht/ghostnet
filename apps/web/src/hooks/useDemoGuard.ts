import { createContext, useContext } from 'react';

interface DemoGuardContext {
  showGuard: () => void;
}

export const DemoGuardCtx = createContext<DemoGuardContext>({
  showGuard: () => {},
});

export function useDemoGuard() {
  return useContext(DemoGuardCtx);
}
