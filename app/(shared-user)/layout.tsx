
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Navbar from "@/components/web/Navbar";
import { ProfileSidebar } from "@/components/web/profile-sidebar"
import { cookies } from "next/headers";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
    const cookieStore = await cookies();
    const defaultOpen = cookieStore.get("sidebar_state")?.value ==="true";
    return (
      <SidebarProvider defaultOpen = {defaultOpen}>
        <ProfileSidebar />
        <main className="w-full">
          
          <Navbar />
          <div className="px-4">{children}</div>
        </main>
      </SidebarProvider>
    )
  }