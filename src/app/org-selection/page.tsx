import { OrganizationList } from '@clerk/nextjs';

const OrganizationListPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/"
        afterCreateOrganizationUrl="/"
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg',
          },
        }}
      />
    </div>
  );
};

export default OrganizationListPage;
