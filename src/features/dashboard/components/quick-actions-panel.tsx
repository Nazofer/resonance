import { quickActions } from '@/features/dashboard/data/quick-actions';
import { QuickActionsCard } from '@/features/dashboard/components/quick-actions-card';

export function QuickActionsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Quick actions</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map(action => (
          <QuickActionsCard
            key={action.title}
            title={action.title}
            description={action.description}
            gradient={action.gradient}
            href={action.href}
          />
        ))}
      </div>
    </div>
  );
}
