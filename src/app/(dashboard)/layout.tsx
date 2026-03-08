import { cookies } from 'next/headers';

import {
  SidebarProvider, SidebarInset
} from '@/components/ui/sidebar';
import React from 'react';
import DashboardSidebar from '@/features/dashboard/components/dashboard-sidebar';

const DashboardLayout = async ({ children }: React.PropsWithChildren) => {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
      <DashboardSidebar />
      <SidebarInset className="min-h-0 min-w-0">
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
