"use client"


import { MonitorCog, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"


import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"


    



export function ModeToggle() {
   const { theme, setTheme } = useTheme()

  return (
    <Tabs value={theme ?? "system"} onValueChange={(value) => setTheme(value)}>
      <TabsList>
        <TabsTrigger value="light" aria-label="Light Mode">
          <Sun />
          
        </TabsTrigger>
        <TabsTrigger value="dark" aria-label="Dark Mode">
          <Moon />
          
        </TabsTrigger>
        <TabsTrigger value="system" aria-label="System Theme">
          <MonitorCog  />
          
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
