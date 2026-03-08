import DashboardLayoutComponent from '@/features/dashboard/layouts/dashboard-layout';

const DashboardLayout = ({ children }: React.PropsWithChildren) => {
  return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>;
};

export default DashboardLayout;