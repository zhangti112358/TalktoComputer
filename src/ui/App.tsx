import { useEffect, useState } from 'react'
import './App.css'
import { Button } from "@/components/ui/button"
import { Home, Command, MessageSquare } from "lucide-react"; // 图标库

import { BACKGROUND_IMG, NAV_HEIGHT } from './Common.tsx';

// apps
import { AppHome } from "./AppHome.tsx";
import { AppShortcut } from "./AppShortcut.tsx";
import { AppChat } from "./AppChat.tsx";


export function App1() {
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
              className='w-full h-full'
              style={{
                position: 'absolute',
                top: 0,
                bottom: NAV_HEIGHT,
                left: 0,
                right: 0,
                backgroundImage: `url(${BACKGROUND_IMG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
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
      style={{
        height: NAV_HEIGHT,
        // 添加玻璃拟态效果
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
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


import { AudioRecorderComponent } from './media.tsx';
import { Component } from '@/components/table-1.tsx';
import { DataTableDemo } from '@/components/table-2.tsx';
export function App(){
  // return App1();

  // 测试
  return <DataTableDemo />
  return <Component />
  // return <AudioRecorderComponent />
}