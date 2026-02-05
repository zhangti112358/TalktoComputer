/* 全局状态 */
import React, { createContext, useState, useEffect, useRef, useContext, ReactNode } from 'react';
import { sendTextType, ShortcutCommand, TextAutoProcess, MemoryTransfer } from '@/electron/computer/define';

// 全局状态类型
interface GlobalStateType {

  // 音频录制
  recording: boolean;
  setRecording: (recording: boolean) => void;
  autoRecord: boolean;
  setAutoRecord: (autoRecord: boolean) => void;
  hasInitializedRecoder: React.MutableRefObject<boolean>;

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

  // app log
  logList: string[];
  setLogList: (logList: string[]) => void;

  // memory
  memoryList: MemoryTransfer[];
  setMemoryList: (memoryList: MemoryTransfer[]) => void;

  // 主动对话内容
  activeChatResponse: string;
  setActiveChatResponse: (response: string) => void;
};

// 创建全局状态上下文
export const GlobalStateContext = createContext<GlobalStateType | undefined>(undefined);

// 创建全局状态提供器
export const GlobalStateProvider = ({ children }: {children:ReactNode}) => {
  // 音频录制状态
  const [recording, setRecording] = useState(false);
  const [autoRecord, setAutoRecord] = useState(true);
  const hasInitializedRecoder = useRef(false);

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

  // app log
  const [logList, setLogList] = useState<string[]>([]);

  // 记忆
  const [memoryList, setMemoryList] = useState<MemoryTransfer[]>([]);

  // 主动对话内容
  const [activeChatResponse, setActiveChatResponse] = useState<string>("");

  // 初始化状态 让 useEffect 只运行一次 因为react在StrictMode下会运行两次
  const hasInitializedRef = useRef(false);

  // 使用 useEffect 在组件初始化时获取数据
  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

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

    // 注册事件监听器 log
    const logListener = (event: any, message: string) => {
      // 将新的日志添加到日志列表中
      setLogList(prevLogList => [...prevLogList, message]);
    };
    window.electron.ipcRenderer.on('log', logListener); // 监听 log 事件

    // 注册事件监听器 memory
    const memoryListener = (event: any, message: string) => {
      // 将新的记忆添加到记忆列表中
      const memoryThis: MemoryTransfer = JSON.parse(message);
      setMemoryList(prevMemoryList => [...prevMemoryList, memoryThis]);
    };
    window.electron.ipcRenderer.on('memory', memoryListener); // 监听 memory 事件

    // 注册事件监听器 activeChatResponse
    const activeChatResponseListener = (event: any, response: string) => {
      // 更新主动对话内容
      setActiveChatResponse(response);
    };
    window.electron.ipcRenderer.on('activeChatResponse', activeChatResponseListener); // 监听 activeChatResponse 事件

    // 清理函数，组件卸载时移除监听器
    return () => {
      window.electron.ipcRenderer.removeListener('log', logListener);
      window.electron.ipcRenderer.removeListener('memory', memoryListener);
      window.electron.ipcRenderer.removeListener('activeChatResponse', activeChatResponseListener);
    };
  }, []); // 空依赖数组，只在组件挂载时运行一次

  // 将状态提供给子组件
  const value = {
    recording,
    setRecording,
    autoRecord,
    setAutoRecord,
    hasInitializedRecoder,
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
    logList,
    setLogList,
    memoryList,
    setMemoryList,
    activeChatResponse,
    setActiveChatResponse,
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