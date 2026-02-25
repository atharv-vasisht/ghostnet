import { useState } from 'react';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Environment from './Environment';
import Services from './Services';
import Endpoints from './Endpoints';
import Integrations from './Integrations';

type ConfigTab = 'environment' | 'services' | 'endpoints' | 'integrations';

const TABS: { id: ConfigTab; label: string }[] = [
  { id: 'environment', label: 'Environment' },
  { id: 'services', label: 'Services' },
  { id: 'endpoints', label: 'Endpoints' },
  { id: 'integrations', label: 'Integrations' },
];

export default function Config() {
  const [activeTab, setActiveTab] = useState<ConfigTab>('environment');

  return (
    <div className="min-h-full bg-void p-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-cyan" />
            <h1 className="font-display text-xl font-bold text-text-primary">
              Configuration
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your deception environment settings
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'relative px-4 py-2.5 text-sm font-medium transition-colors duration-150',
                activeTab === id
                  ? 'text-cyan'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {label}
              {activeTab === id && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-cyan" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'environment' && <Environment />}
          {activeTab === 'services' && <Services />}
          {activeTab === 'endpoints' && <Endpoints />}
          {activeTab === 'integrations' && <Integrations />}
        </div>
      </div>
    </div>
  );
}
