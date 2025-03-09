/* 全局状态 */
import React, { createContext, useState, useReducer, useContext, ReactNode } from 'react';

// 全局状态类型
interface GlobalStateType {
  // 音频录制
  recording: boolean;
  setRecording: (recording: boolean) => void;

  // 主界面
  activeApp: string | null;
  setActiveApp: (activeApp: string | null) => void;
};

// 创建全局状态上下文
export const GlobalStateContext = createContext<GlobalStateType | undefined>(undefined);

// 创建全局状态提供器
export const GlobalStateProvider = ({ children }: {children:ReactNode}) => {
  // 音频录制状态
  const [recording, setRecording] = useState(false);

  // 主界面状态
  const [activeApp, setActiveApp] = useState<string | null>(null);

  // 将状态提供给子组件
  const value = {
    recording,
    setRecording,
    activeApp,
    setActiveApp,
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// 提供一个自定义 Hook 来使用这个上下文
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (context === undefined) {
    throw new Error('useGlobalState 必须在 GlobalStateProvider 内部使用');
  }
  return context;
}