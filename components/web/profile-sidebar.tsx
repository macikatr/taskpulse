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
  Plus

} from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
  SidebarGroupContent,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"

import { NavUser } from "./nav-user"

import Image from "next/image"
import logo from "@/public/cift_halka.png"
import Link from "next/link"
import { cn } from "@/lib/utils"


// This is sample data.
const data = {
  user: {
    name: "Ömer Faruk Kılıç",
    email: "ofk@mikrotest.com.tr",
    avatar: "https://avatar.vercel.sh/rauchg.svg?text=OFK",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

const items = [
  {
    title: "Dashboard",
    url: "#",
    icon: ShieldCheck,
  },
  {
    title: "Workspaces",
    url: "#",
    icon: Database,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
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
  const { state } = useSidebar();
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader className="flex items-center gap-2 p-2 ">
        <Link href="/" className="flex min-w-0 items-center gap-2 ">
          <Image src={logo} alt="logo" width={25} height={25} className="shrink-0" />
        <div className={cn("align-middle", state === "collapsed"
                ? "hidden"
                : "truncate whitespace-nowrap")}><span className="font-[michroma] tracking-wider"
          >mikrotest</span></div>
        
        {/* <span className={`font-[michroma] tracking-wider ${state === "collapsed"
                ? "hidden"
                : "truncate whitespace-nowrap"}`}
          >mikrotest</span> */}
         </Link> 
      </SidebarHeader>
      <div className="grid grid-flow-col justify-items-center"><div className="w-3/5"><SidebarSeparator /></div></div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel> Application </SidebarGroupLabel>
          <SidebarMenu>
            {items.map(item =>(
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton render={
                  <Link href={item.url}>
                    <item.icon className="w-4 h-4 mr-2" />
                    <span>{item.title}</span>
                  </Link>
                }>

                </SidebarMenuButton>

              </SidebarMenuItem>

            ) 
            )}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup> 

          <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupAction>
              <Plus /> <span className="sr-only">Add Project</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu> 
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    
                    
                      <span className="flex items-center gap-2 text-xs font-medium ">
                        <Database className="w-4 h-4" />
                        <span>Tasks</span>
                      </span>
                    
                  
                    
                    
                  </SidebarMenuButton>
                  <SidebarMenuBadge> 24 </SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>

        </SidebarGroup>

        
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{name: data.user.name, email: data.user.email, avatar: data.user.avatar}} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}