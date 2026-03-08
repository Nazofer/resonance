'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  OrganizationSwitcher, UserButton, useClerk
} from '@clerk/nextjs';
import Link from 'next/link';
import {
  Headphones,
  House,
  LayoutGrid,
  Settings,
  Volume2,
  AudioLines,
  type LucideIcon
} from 'lucide-react';

interface MenuItem {
  title: string
  url?: string
  icon: LucideIcon
  onClick?: () => void
}

interface NavSectionProps {
  label?: string
  items: MenuItem[]
  pathname: string
}

function NavSection({ label, items, pathname }: NavSectionProps) {
  return (
    <SidebarGroup>
      {label && (
        <SidebarGroupLabel className="text-[13px] text-muted-foreground uppercase">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(item => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={
                  item.url
                    ? item.url === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.url)
                    : false
                }
                onClick={item.onClick}
                tooltip={item.title}
                render={item.url ? <Link href={item.url} /> : undefined}
                className={cn(
                  'h-9 border border-transparent px-3 py-2 text-[13px] font-medium tracking-tight',
                  'data-[active=true]:border-border',
                  'data-[active=true]:shadow-[0px_1px_1px_0px_rgba(44,54,53,0.03),inset_0px_0px_0px_2px_white]',
                )}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const clerk = useClerk();

  const mainMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      url: '/',
      icon: House,
    },
    {
      title: 'Explore voices',
      url: '/voices',
      icon: LayoutGrid,
    },
    {
      title: 'Text to speech',
      url: '/text-to-speech',
      icon: AudioLines,
    },
    {
      title: 'Voice cloning',
      icon: Volume2,
    },
  ];

  const othersMenuItems: MenuItem[] = [
    {
      title: 'Settings',
      icon: Settings,
      onClick: () => {
        clerk.openOrganizationProfile();
      },
    },
    {
      title: 'Help and support',
      url: 'mailto:business@codewithantonio.com',
      icon: Headphones,
    },
  ];

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex flex-col gap-4 pt-4">
          <div
            className={cn(
              'flex items-center gap-2 pl-1',
              'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-0',
            )}
          >
            <Image
              src="/logo.svg"
              alt="Resonance"
              width={24}
              height={24}
              className="rounded-sm"
            />
            <span
              className={cn(
                'text-lg font-semibold tracking-tighter text-foreground',
                'group-data-[collapsible=icon]:hidden',
              )}
            >
              Resonance
            </span>
            <SidebarTrigger className="ml-auto lg:hidden" />
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <OrganizationSwitcher
                hidePersonal
                fallback={(
                  <Skeleton className="h-8.5 w-full rounded-md border bg-white group-data-[collapsible=icon]:size-8" />
                )}
                appearance={{
                  elements: {
                    rootBox:
                      'w-full! group-data-[collapsible=icon]:w-auto! group-data-[collapsible=icon]:flex! group-data-[collapsible=icon]:justify-center!',
                    organizationSwitcherTrigger:
                      'w-full! justify-between! bg-white! border! border-border! rounded-md! pl-1! pr-2! py-1! gap-3! '
                      + 'group-data-[collapsible=icon]:w-auto! group-data-[collapsible=icon]:p-1! '
                      + 'shadow-[0px_1px_1.5px_0px_rgba(44,54,53,0.03)]!',
                    organizationPreview: 'gap-2!',
                    organizationPreviewAvatarBox: 'size-6! rounded-sm!',
                    organizationPreviewTextContainer:
                      'text-xs! tracking-tight! font-medium! text-foreground! group-data-[collapsible=icon]:hidden!',
                    organizationPreviewMainIdentifier: 'text-[13px]!',
                    organizationSwitcherTriggerIcon:
                      'size-4! text-sidebar-foreground! group-data-[collapsible=icon]:hidden!',
                  },
                }}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <div className="border-b border-dashed border-border" />
        <SidebarContent>
          <NavSection items={mainMenuItems} pathname={pathname} />
          <NavSection
            label="Others"
            items={othersMenuItems}
            pathname={pathname}
          />
        </SidebarContent>
        <div className="border-b border-dashed border-border" />
        <SidebarFooter className="gap-3 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <UserButton
                showName
                fallback={(
                  <Skeleton
                    className={cn(
                      'h-8.5 w-full rounded-md border border-border bg-white',
                      'group-data-[collapsible=icon]:size-8',
                    )}
                  />
                )}
                appearance={{
                  elements: {
                    rootBox:
                      'w-full! group-data-[collapsible=icon]:w-auto! group-data-[collapsible=icon]:flex! group-data-[collapsible=icon]:justify-center!',
                    userButtonTrigger:
                      'w-full! justify-between! bg-white! border! border-border! rounded-md! pl-1! pr-2! py-1! shadow-[0px_1px_1.5px_0px_rgba(44,54,53,0.03)]! group-data-[collapsible=icon]:w-auto! group-data-[collapsible=icon]:p-1! group-data-[collapsible=icon]:after:hidden! [--border:color-mix(in_srgb,transparent,var(--clerk-color-neutral,#000000)_15%)]!',
                    userButtonBox: 'flex-row-reverse! gap-2!',
                    userButtonOuterIdentifier:
                      'text-[13px]! tracking-tight! font-medium! text-foreground! pl-0! group-data-[collapsible=icon]:hidden!',
                    userButtonAvatarBox: 'size-6!',
                  },
                }}
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}

export default DashboardSidebar;
