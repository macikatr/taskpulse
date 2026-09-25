"use client";
import { Bell, LogOut, Moon, Settings, Sparkles, Sun, User } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FullscreenToggle from "@/components/web/full-screen-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar"


export default function Navbar() {
    const { theme, setTheme } = useTheme()

    function toggleTheme() {
        if (theme === "dark") {
            setTheme("light")
        } else {
            setTheme("dark")
        }
    }

  return (
    <nav className="flex pt-2 pb-4 pl-0 pr-4 items-center justify-between border-b border-zinc-800">
    {/* LEFT SIDE */}
    <div className="grid grid-cols-1 "><SidebarTrigger />
    <span className="pl-2 text-xs text-zinc-400 font-medium">UserName</span>
    <span className="pl-2 text-xs text-zinc-400 font-medium">user@example.com</span>
    </div>
    
    {/* RIGHT SIDE */}
    <div className="flex items-center gap-3">
        <Link href="/" className=" ">Dashboard</Link>
    {/* NOTIFICATIONS BADGE */}
    <div className="relative inline-block">
      <Bell className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))} />
      {/* Okunmamış bildirim rozeti */}
      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full ring-2 ring-white" />
    </div>
    
    {/* THEME TABS */}
        <Button variant="ghost" onClick={toggleTheme}>
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />

        </Button>
        
    {/* FULLSCREEN BTN */}
        <FullscreenToggle />
    {/* AVATAR MENU */}
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Avatar>
                    <AvatarImage src="https://avatar.vercel.sh/rauchg.svg?text=OFK" />
                    <AvatarFallback>
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                    </AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
                
             
            <DropdownMenuContent sideOffset={8}>
                <DropdownMenuGroup>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <User className="w-[1.2rem] h-[1.2rem] mr-2" />
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <Settings className="w-[1.2rem] h-[1.2rem] mr-2"/>
                    Settings
                </DropdownMenuItem>

                    
                <DropdownMenuItem variant="destructive">
                    <LogOut className="w-[1.2rem] h-[1.2rem] mr-2"/>
                    Log Out
                </DropdownMenuItem>

                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
        
    </div>

    
    </nav>
   
  )
}