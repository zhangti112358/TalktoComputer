/* 全局状态 */
import React, { createContext, useState, useEffect, useRef, useReducer, useContext, ReactNode } from 'react';
import { sendTextType, ShortcutCommand, TextAutoProcess } from '@/electron/computer/define';

// 全局状态类型
interface GlobalStateType {

  // 音频录制
  recording: boolean;
  setRecording: (recording: boolean) => void;

  // 主界面
  activeApp: string | null;
  setActiveApp: (activeApp: string | null) => void;

  // 系统信息
  apiKey: string;
  setApiKey: (apiKey: string) => void;
  balance: string | null;
  setBalance: (balance: string | null) => void;

  // app shortcut
  shortcutCommandList: ShortcutCommand[];
  setShortcutCommandList: (shortcutCommand: ShortcutCommand[]) => void;

  // 文字操作
  textAutoProcess: TextAutoProcess;
  setTextAutoProcess: (textAutoProcess: TextAutoProcess) => void;
};

// 创建全局状态上下文
export const GlobalStateContext = createContext<GlobalStateType | undefined>(undefined);

// 创建全局状态提供器
export const GlobalStateProvider = ({ children }: {children:ReactNode}) => {
  // 音频录制状态
  const [recording, setRecording] = useState(false);

  // 主界面状态
  const [activeApp, setActiveApp] = useState<string | null>(null);

  // 系统信息
  const [apiKey, setApiKey] = useState("");
  const [balance, setBalance] = useState<string | null>(null);

  // app shortcut
  const [shortcutCommandList, setShortcutCommandList] = useState<ShortcutCommand[]>([]);
  
  // 文字操作
  const defaultTextAutoProcess: TextAutoProcess = {
    autoCopyFlag: true,
    autoPasteFlag: false,
    autoEnterFlag: false,
  };
  const [textAutoProcess, setTextAutoProcess] = useState<TextAutoProcess>(defaultTextAutoProcess);


  // 使用 useEffect 在组件初始化时获取数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 获取初始 API Key
        const initialApiKey = await window.electron.sendTextData(sendTextType.getSiliconflowKey, '');
        if (initialApiKey) {
          setApiKey(initialApiKey);
        }
        
        // 如果有 API Key，也获取余额
        if (initialApiKey) {
          const initialBalance = await window.electron.sendTextData(sendTextType.getSiliconflowBalance, '');
          if (initialBalance) {
            setBalance(initialBalance);
          }
        }

        // 更新文字处理方式
        await window.electron.sendTextData(sendTextType.updateTextAutoProcess, JSON.stringify(textAutoProcess));

        // 获取快捷指令列表
        const initialShortcutCommandList = await window.electron.sendTextData(sendTextType.getShortcutCommand, '');
        if (initialShortcutCommandList) {
          setShortcutCommandList(JSON.parse(initialShortcutCommandList));
        }
      } catch (error) {
        console.error('初始化数据失败:', error);
      } 
    };
    
    initializeData();
  }, []); // 空依赖数组，只在组件挂载时运行一次

  // 将状态提供给子组件
  const value = {
    recording,
    setRecording,
    activeApp,
    setActiveApp,
    apiKey,
    setApiKey,
    balance,
    setBalance,
    shortcutCommandList,
    setShortcutCommandList,
    textAutoProcess,
    setTextAutoProcess,
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