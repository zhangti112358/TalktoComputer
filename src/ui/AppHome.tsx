import { AppSidebar } from "@/components/app-home-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import { NAV_HEIGHT } from './Common.tsx';


function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar 
      style={{ 
        height: `calc(100vh - ${NAV_HEIGHT})`,
      }}
      />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}

export function AppHome() {
  // const [number1, setNumber1]     = useState(0);
  return (
      <Layout>
        <h2 className="text-lg font-semibold">App 1</h2>
        <p>App 1 的内容</p>
        {/* <p>${number1}</p> */}
      </Layout>
    );
}