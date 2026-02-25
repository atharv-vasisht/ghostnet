import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth';
import { DemoLayout } from '@/components/layout/DemoLayout';

export default function Demo() {
  const setDemo = useAuthStore((s) => s.setDemo);

  useEffect(() => {
    setDemo(true);
    return () => setDemo(false);
  }, [setDemo]);

  return <DemoLayout />;
}
