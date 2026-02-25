import { Outlet } from 'react-router-dom';
import { DemoBar } from './DemoBar';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DemoGuardProvider } from './DemoGuardModal';

export function DemoLayout() {
  return (
    <DemoGuardProvider>
      <div className="flex min-h-screen flex-col bg-void">
        <div className="fixed left-0 right-0 top-0 z-40">
          <DemoBar />
        </div>
        <div className="flex flex-1 pt-10">
          <Sidebar basePath="/demo" demoMode />
          <div className="flex flex-1 flex-col pl-60">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </DemoGuardProvider>
  );
}
