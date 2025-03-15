import { useEffect, useState } from 'react'
import './App.css'
import { Home, Star, MessageSquare } from "lucide-react"; // 图标库
import { BACKGROUND_IMG, NAV_HEIGHT } from './Common.tsx';
import { useGlobalState, GlobalStateProvider } from './globalState';

// apps
import { AppHome } from "./AppHome.tsx";
import { AppShortcut } from "./AppShortcut.tsx";
import { AppLog } from "./AppLog.tsx";

// media
import { AudioRecorderComponent } from './media.tsx';

export function AppDefault() {
  // 全局状态
  const { activeApp, setActiveApp } = useGlobalState();
  const { recording, setRecording } = useGlobalState();

  // 控制翻转动画的状态
  const [isFlipping, setIsFlipping] = useState(false);
  const [displayedImage, setDisplayedImage] = useState(recording ? "./data/panda_front.JPG" : "./data/panda_back.JPG");
  
  // 监听recording状态变化，触发翻转动画
  useEffect(() => {

    if (isFlipping) return; // 避免动画正在进行时再次触发
    
    setIsFlipping(true);
    // 在动画中途切换图片
    setTimeout(() => {
      setDisplayedImage(recording ? "./data/panda_front.JPG" : "./data/panda_back.JPG");
    }, 100); // 动画持续时间的一半
    
    // 动画结束后重置状态
    setTimeout(() => {
      setIsFlipping(false);
    }, 200); // 动画完整持续时间
  }, [recording]);

  // App 数据
  const apps = [
    { id: "app1", name: "Home", icon: <Home size={10} /> },
    { id: "app2", name: "Shortcut", icon: <Star size={33} /> },
    { id: "app3", name: "Log", icon: <MessageSquare size={33} /> },
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
          <AppShortcut></AppShortcut>
        </div>
      )}
      {activeApp === "app3" && (
        <div>
          <AppLog></AppLog>
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
      className="fixed bottom-0 left-0 right-0 flex justify-center items-center bg-gray-800 bg-opacity-50 space-x-4 mx-auto"
      style={{
        height: NAV_HEIGHT,
        // 添加玻璃拟态效果
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {/* appHome */}
      <div
        onClick={() => {
          if (activeApp === apps[0].id) {
            setActiveApp(null)
          }
          else {
            setActiveApp("app1")
          }
        }}
        className={`flex items-center justify-center cursor-pointer ${activeApp === "app1" ? 'ring-2 ring-white/50' : ''}`}
      >
        <div className={`transition-transform duration-200 ${isFlipping ? 'scale-x-0' : 'scale-x-100'}`}>
          <img
            src={displayedImage}
            alt="Panda Icon"
            width={50}
            height={50}
            className="max-w-none"
          />
        </div>
      </div>

      {/* 其他app 先统一样式 */}
      {apps.map((app) => (
        app.id !== "app1" &&
        <div
          key={app.id}
          onClick={() => {
            if (activeApp === app.id) {
              setActiveApp(null)
            }
            else {
              setActiveApp(app.id)
            }
          }}
          className={`flex items-center justify-center cursor-pointer ${activeApp === app.id ? 'ring-2 ring-white/50' : ''}`}
        >
          <div className="p-2 text-white">
            {app.icon}
          </div>
        </div>
      ))}
    </div>
    <AudioRecorderComponent />
  </div>
);
}


export function App(){
  return <GlobalStateProvider>
    <AppDefault />
  </GlobalStateProvider>

  // 测试
  // return <GlobalStateProvider>
  // <AppDefault />
  // </GlobalStateProvider>
}