import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { SettingsDialog } from "@/components/settings-dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ListTodoIcon,
  CameraIcon,
  FolderGitIcon,
  Settings2Icon,
  CommandIcon,
} from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Photos",
      url: "/photos",
      icon: <CameraIcon />,
    },
    {
      title: "Todos",
      url: "/todos",
      icon: <ListTodoIcon />,
    },
    {
      title: "GitHub",
      url: "/repos",
      icon: <FolderGitIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      icon: <Settings2Icon />,
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  const navSecondary = React.useMemo(
    () =>
      data.navSecondary.map((item) =>
        item.title === "Settings"
          ? { ...item, onSelect: () => setSettingsOpen(true) }
          : item
      ),
    []
  )

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <CommandIcon className="size-5!" />
              <span className="text-base font-semibold">memo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Sidebar>
  )
}
