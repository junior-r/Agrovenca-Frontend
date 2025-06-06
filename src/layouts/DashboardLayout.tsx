import AppSidebar from '@/components/pages/dashboard/Sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useAutoClearResponseStatus } from '@/hooks/useAutoClearResponseStatus'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useRequireRole } from '@/hooks/useRequireRole'
import { useAuthStore } from '@/store/auth/useAuthStore'
import { Outlet } from 'react-router-dom'

function DashboardLayout() {
  const user = useAuthStore((state) => state.user)

  useRequireAuth()
  useRequireRole()
  useAutoClearResponseStatus()

  return (
    <section className="w-full h-full">
      <section className="grid grid-cols-[auto_1fr] grid-rows-[1fr] gap-y-[10px] gap-x-[10px] min-h-screen">
        <section className="">
          <SidebarProvider>
            <AppSidebar user={user} />
            <main>
              <SidebarTrigger />
            </main>
          </SidebarProvider>
        </section>
        <section className="w-full p-6 max-w-screen-2xl mx-auto">
          layout
          <Outlet />
        </section>
      </section>
    </section>
  )
}

export default DashboardLayout
