


"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings,
  SquareTerminal,
  ShieldCheck,
  Database,
  Search,
  Calendar,
  Settings2,
  ChevronRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { NavUser } from "./nav-user"

import Image from "next/image"
import logo from "@/public/cift_halka.png"
import Link from "next/link"
import { cn } from "@/lib/utils"

const data = {
  user: {
    name: "Ömer Faruk Kılıç",
    email: "ofk@mikrotest.com.tr",
    avatar: "https://avatar.vercel.sh/rauchg.svg?text=OFK",
  },
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "History", url: "#" },
        { title: "Starred", url: "#" },
        { title: "Settings", url: "#" },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        { title: "Genesis", url: "#" },
        { title: "Explorer", url: "#" },
        { title: "Quantum", url: "#" },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        { title: "Introduction", url: "#" },
        { title: "Get Started", url: "#" },
        { title: "Tutorials", url: "#" },
        { title: "Changelog", url: "#" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        { title: "General", url: "#" },
        { title: "Team", url: "#" },
        { title: "Billing", url: "#" },
        { title: "Limits", url: "#" },
      ],
    },
  ],
}

const items = [
  {
    title: "Dashboard",
    url: "#",
    icon: ShieldCheck,
    items: [
      { title: "Overview", url: "#" },
      { title: "Reports", url: "#" },
    ],
  },
  {
    title: "Workspaces",
    url: "#",
    icon: Database,
    items: [
      { title: "Projects", url: "#" },
      { title: "Members", url: "#" },
    ],
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Tasks",
    url: "#",
    icon: Database,
    items: [
      { title: "Open", url: "#" },
      { title: "Done", url: "#" },
    ],
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

export function ProfileSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader className="flex items-center gap-2 p-2">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src={logo}
            alt="logo"
            width={25}
            height={25}
            className="shrink-0"
          />

          <span
            className={cn(
              "font-[michroma] tracking-wider",
              state === "collapsed" ? "hidden" : "truncate whitespace-nowrap"
            )}
          >
            mikrotest
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>

          <SidebarMenu>
            {items.map((item) => {
              const Icon = item.icon
              const hasChildren = !!item.items?.length

              return (
                <SidebarMenuItem key={item.title} className="group">
                  {state === "collapsed" ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<button
                          type="button"
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground transition-colors",
                            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                          )}
                          aria-label={item.title}
                        >
                          <Icon className="h-4 w-4" />
                        </button>}>
                        
                      </DropdownMenuTrigger>

                      {hasChildren && (
                        <DropdownMenuContent
                          side="right"
                          align="start"
                          sideOffset={8}
                          className="w-48"
                        >
                          {items.map((subItem) => (
                            <DropdownMenuItem key={subItem.title} render={
                              <Link href={subItem.url} className="flex w-full items-center gap-2">
                                <span>{subItem.title}</span>
                              </Link>
                            }>
                              
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      )}
                    </DropdownMenu>
                  ) : (
                    <>
                      <SidebarMenuButton
                        render={
                          <Link href={item.url} className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        }
                      />

                      {hasChildren && (
                        <SidebarMenuSub>
                          {items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton render={
                                <Link href={subItem.url}>{subItem.title}</Link>
                              } />
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  )}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: data.user.name,
            email: data.user.email,
            avatar: data.user.avatar,
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
