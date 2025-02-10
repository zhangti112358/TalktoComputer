import { useEffect, useState } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Home, Command, MessageSquare } from "lucide-react"; // 图标库

import { NAV_HEIGHT, MAIN_PADDING } from './AppCommon.tsx';

// apps
import { AppHome } from "./AppHome.tsx";
import { AppShortcut } from "./AppShortcut.tsx";
import { AppChat } from "./AppChat.tsx";
import { AppSidebar } from "@/components/app-home-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"


function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar 
      style={{ 
        height: `calc(100vh - ${NAV_HEIGHT})`,
        paddingBottom: MAIN_PADDING 
      }}
      />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}

export function App() {
  const [activeApp, setActiveApp] = useState<string | null>(null);

  // App 数据
  const apps = [
    { id: "app1", name: "Home", icon: <Home size={10} /> },
    { id: "app2", name: "Shortcut", icon: <Command size={10} /> },
    { id: "app3", name: "Chat", icon: <MessageSquare size={10} /> },
  ];


return (
  <div className="h-screen" style={{ '--nav-height': NAV_HEIGHT } as React.CSSProperties}>
    {/* 主内容区域 */}
    <main 
      className="fixed top-0 left-0 right-0 overflow-auto px-6" 
      style={{ 
        height: `calc(100vh - ${NAV_HEIGHT})`,
        paddingBottom: MAIN_PADDING 
      }}
    >
      {activeApp === "app1" && (
          <AppHome></AppHome>
        )}
        {activeApp === "app2" && (
          <div>
            <h2 className="text-lg font-semibold">App 2</h2>
            <p>App 2 的内容</p>
          </div>
        )}
        {activeApp === null && (
          <div className="fixed inset-0 w-screen h-screen overflow-hidden">
            <div 
              className="w-full h-full bg-[url('data/icon_panda.JPG')] bg-contain bg-center bg-no-repeat"
              style={{
                position: 'absolute',
                top: 0,
                bottom: NAV_HEIGHT,
                left: 0,
                right: 0,
                backgroundSize: 'cover'
              }}
            >
            </div>
          </div>
        )}
        {/* 其他app的内容... */}
      </main>

    {/* 底部导航栏 */}
    <div 
      className="fixed bottom-0 left-0 right-0 flex justify-center items-center bg-gray-300 space-x-4 mx-auto"
      style={{ height: NAV_HEIGHT }}
    >
      {apps.map((app) => (
        <Button
          key={app.id}
          variant="ghost"
          size="icon"
          onClick={() => {
            if (activeApp === app.id) {
            setActiveApp(null)
          }
          else {
            setActiveApp(app.id)
          }
          }}
          className={activeApp === app.id ? 'ring-2 ring-white' : ''}
        >
          {app.icon}
        </Button>
      ))}
    </div>
  </div>
);
}

