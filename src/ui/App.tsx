import { useEffect, useState } from 'react'
import './App.css'
import { Home, Star, MessageSquare } from "lucide-react"; // 图标库
import { BACKGROUND_IMG, PANDA_FRONT_IMG, PANDA_BACK_IMG, SEAHORSE_IMG, STAR_IMG, NAV_HEIGHT } from './Common.tsx';
import { useGlobalState, GlobalStateProvider } from './globalState';
import { MicVAD } from "@ricky0123/vad-web";


// apps
import { AppHome } from "./AppHome.tsx";
import { AppShortcut } from "./AppShortcut.tsx";
import { AppLog } from "./AppLog.tsx";
import { AppMemory } from "./AppMemory.tsx";

// media
import { AudioRecorderComponent } from './media.tsx';


export const AudioRecorderComponent2 = () => {
  const { setRecording } = useGlobalState();

  useEffect(() => {
    let myvad: any = null;

    const initVAD = async () => {
      try {
        myvad = await MicVAD.new({
          onSpeechStart: () => {
            console.log("Speech start detected");
            setRecording(true);
          },
          onSpeechEnd: (audio) => {
            console.log("Speech end detected");
            setRecording(false);
            // 这里可以处理 audio (Float32Array)
            // 例如发送到后端或进行语音转文字
          },
          // 如果是本地开发，onnxruntime 的 WASM 文件通常需要正确配置路径
          // 在 Electron 环境中，这些可以直接引用 CDN 或放置在 public 目录下
          onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
          baseAssetPath: "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/",
        });
        
        myvad.start();
      } catch (e) {
        console.error("VAD init failed:", e);
      }
    };

    initVAD();

    return () => {
      if (myvad) {
        myvad.pause();
      }
    };
  }, [setRecording]);

  return null; // 此组件仅负责 VAD 逻辑，不渲染 UI
};

export function AppDefault() {
  // 全局状态
  const { activeApp, setActiveApp } = useGlobalState();
  const { recording, setRecording } = useGlobalState();

  // 控制翻转动画的状态
  const [isFlipping, setIsFlipping] = useState(false);
  const [displayedImage, setDisplayedImage] = useState(recording ? `url(${PANDA_FRONT_IMG})` : `url(${PANDA_BACK_IMG})`);
  
  // 监听recording状态变化，触发翻转动画
  useEffect(() => {

    if (isFlipping) return; // 避免动画正在进行时再次触发
    
    setIsFlipping(true);
    // 在动画中途切换图片
    setTimeout(() => {
      setDisplayedImage(recording ? PANDA_FRONT_IMG : PANDA_BACK_IMG);
    }, 100); // 动画持续时间的一半
    
    // 动画结束后重置状态
    setTimeout(() => {
      setIsFlipping(false);
    }, 200); // 动画完整持续时间
  }, [recording]);

  // App 数据
  const apps = [
    { id: "app1", name: "Home", icon: <Home size={10} /> },
    { id: "app2", name: "Shortcut", icon: (
      <div className="p-0">
        <img 
          src={STAR_IMG} 
          alt="star Icon" 
          width={50}
          height={50}
          className="max-w-none"
        />
      </div>
    )},
    // { id: "app3", name: "Log", icon: <MessageSquare size={33} /> },
    { id: "app4", name: "Memory", icon: (
    <div className="p-0">
      <img 
        src={SEAHORSE_IMG} 
        alt="Memory Icon" 
        width={50}
        height={50}
        className="max-w-none"
      />
    </div>
  )},
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
      {activeApp === "app4" && (
        <div>
          <AppMemory></AppMemory>
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
          <div className="p-0 text-white">
            {app.icon}
          </div>
        </div>
      ))}
    </div>
    <AudioRecorderComponent />
    <AudioRecorderComponent2 />

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