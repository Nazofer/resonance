import {
  History, Settings
} from 'lucide-react';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

import SettingsPanelHistory from './settings-panel-history';
import SettingsPanelSettings from './settings-panel-settings';
import { cn } from '@/lib/utils';

const tabTriggerClassName
  = cn(`
    h-full flex-1 gap-2 rounded-none border-x-0 border-t-0 border-b border-b-transparent bg-transparent shadow-none
    data-[state=active]:border-b-foreground
    group-data-[variant=default]/tabs-list:data-[state=active]:shadow-none
  `);

export function SettingsPanel() {
  return (
    <div className="hidden min-h-0 w-105 flex-col border-l lg:flex">
      <Tabs
        defaultValue="settings"
        className="flex h-full min-h-0 flex-col gap-y-0"
      >
        <TabsList className={`
          h-12 w-full rounded-none border-b bg-transparent p-0
          group-data-[orientation=horizontal]/tabs:h-12
        `}
        >
          <TabsTrigger value="settings" className={tabTriggerClassName}>
            <Settings className="size-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="history" className={tabTriggerClassName}>
            <History className="size-4" />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="settings"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <SettingsPanelSettings />
        </TabsContent>
        <TabsContent
          value="history"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <SettingsPanelHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};
